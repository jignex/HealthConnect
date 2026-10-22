
const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();



// =====================================================
// SEARCH AVAILABLE BLOOD
// GET /api/blood/search?bloodGroup=O%2B&city=Mumbai
// =====================================================

router.get('/search', async (req, res) => {

  try {

    const { bloodGroup, city } = req.query;

    if (!bloodGroup || !city) {
      return res.status(400).json({
        error: 'bloodGroup and city are required'
      });
    }

    // =====================================================
    // 1. SEARCH BLOOD RECORDS
    // =====================================================

    const [bloodRecords] = await db.query(
      `SELECT
          id,
          name,
          blood_group,
          city,
          units,
          contact_phone
       FROM blood_records
       WHERE blood_group = ?
         AND city LIKE ?
         AND units > 0
       ORDER BY id DESC`,
      [
        bloodGroup,
        `%${city}%`
      ]
    );

    // =====================================================
    // 2. SEARCH REAL REGISTERED AVAILABLE DONORS
    // =====================================================

    const [donors] = await db.query(
      `SELECT
          d.id,
          d.user_id,
          u.name,
          u.email,
          d.blood_group,
          d.age,
          d.gender,
          d.phone AS contact_phone,
          d.city,
          d.address,
          d.availability_status,
          d.last_donation_date,
          d.created_at
       FROM donors d
       INNER JOIN users u
          ON d.user_id = u.id
       WHERE d.blood_group = ?
         AND d.city LIKE ?
         AND d.availability_status = 'Available'
       ORDER BY d.created_at DESC`,
      [
        bloodGroup,
        `%${city}%`
      ]
    );

    // =====================================================
    // 3. CONVERT DONORS TO THE SAME RESULT FORMAT
    // =====================================================

    const donorResults = donors.map(donor => ({

      id: `donor-${donor.id}`,
      name: donor.name,
      email: donor.email,
      blood_group: donor.blood_group,
      age: donor.age,
      gender: donor.gender,
      city: donor.city,
      address: donor.address,
      units: 1,
      contact_phone: donor.contact_phone,
      availability_status: donor.availability_status,
      last_donation_date: donor.last_donation_date,
      source: 'donor'

    }));

    // =====================================================
    // 4. CONVERT BLOOD RECORDS TO RESULT FORMAT
    // =====================================================

    const bloodResults = bloodRecords.map(record => ({

      id: `blood-${record.id}`,
      name: record.name,
      blood_group: record.blood_group,
      city: record.city,
      units: record.units,
      contact_phone: record.contact_phone,
      source: 'blood_record',
      availability_status: 'Available'

    }));

    // =====================================================
    // 5. COMBINE BLOOD RECORDS + DONORS
    // =====================================================

    const results = [
      ...bloodResults,
      ...donorResults
    ];

    // =====================================================
    // 6. RETURN RESULTS
    // =====================================================

    res.json({
      available: results.length > 0,
      results: results
    });

  } catch (err) {

    console.error(
      "Blood search error:",
      err
    );

    res.status(500).json({
      error: 'Server error while searching blood'
    });

  }

});


// =====================================================
// CREATE A BLOOD REQUEST
// POST /api/blood/request
// =====================================================


/* =====================================================
   SEND BLOOD REQUEST TO A SPECIFIC DONOR
   POST /api/blood/request
===================================================== */

router.post('/request', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.user.id;

    let { donorId, bloodGroup, city, units, urgency } = req.body;

    // Search result IDs may be in the format "donor-1".
    if (typeof donorId === 'string' && donorId.startsWith('donor-')) {
      donorId = donorId.slice(6);
    }

    donorId = Number(donorId);
    units = Number(units);

    if (!donorId || !bloodGroup || !city || !Number.isInteger(units) || units < 1) {
      return res.status(400).json({
        error: 'Valid donor, blood group, city and units are required'
      });
    }

    const [donors] = await db.query(
      `SELECT id, user_id, blood_group, city, availability_status
       FROM donors
       WHERE id = ?`,
      [donorId]
    );

    if (donors.length === 0 || donors[0].availability_status !== 'Available') {
      return res.status(404).json({
        error: 'Donor not found or unavailable'
      });
    }

    const donor = donors[0];

    if (Number(donor.user_id) === Number(requesterId)) {
      return res.status(400).json({
        error: 'You cannot send a blood request to yourself'
      });
    }

    if (donor.blood_group !== bloodGroup) {
      return res.status(400).json({
        error: 'Blood group does not match the selected donor'
      });
    }

    const allowedUrgencies = ['Normal', 'Urgent', 'Emergency'];
    if (urgency && !allowedUrgencies.includes(urgency)) {
      return res.status(400).json({
        error: 'Invalid urgency'
      });
    }

    const [result] = await db.query(
      `INSERT INTO blood_requests
       (user_id, requester_id, donor_id, blood_group, city, units, urgency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        requesterId,
        requesterId,
        donor.id,
        bloodGroup,
        city,
        units,
        urgency || 'Normal'
      ]
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, ?, ?, ?, 0)`,
      [
        donor.user_id,
        'New Blood Request',
        `A user has requested ${units} unit(s) of ${bloodGroup} blood in ${city}. Please check your Blood Requests section.`,
        'blood_request'
      ]
    );

    res.status(201).json({
      message: 'Blood request sent successfully',
      requestId: result.insertId
    });

  } catch (err) {
    console.error('Blood request error:', err);
    res.status(500).json({
      error: 'Server error while sending blood request'
    });
  }
});


/* =====================================================
   GET REQUESTS FOR THE LOGGED-IN DONOR
   GET /api/blood/requests
===================================================== */

router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const [donors] = await db.query(
      `SELECT id FROM donors WHERE user_id = ?`,
      [req.user.id]
    );

    if (donors.length === 0) {
      return res.json({ requests: [] });
    }

    const [rows] = await db.query(
      `SELECT
          br.id,
          br.requester_id,
          br.donor_id,
          br.blood_group,
          br.city,
          br.units,
          br.urgency,
          br.status,
          br.created_at,
          u.name AS requester_name,
          u.email AS requester_email
       FROM blood_requests br
       LEFT JOIN users u ON u.id = br.requester_id
       WHERE br.donor_id = ?
       ORDER BY br.created_at DESC`,
      [donors[0].id]
    );

    res.json({ requests: rows });

  } catch (err) {
    console.error('Blood requests loading error:', err);
    res.status(500).json({
      error: 'Server error while loading blood requests'
    });
  }
});


/* =====================================================
   DONOR CONFIRMS A REQUEST
   PATCH /api/blood/requests/:id/confirm
===================================================== */


router.patch(
  '/requests/:id/confirm',
  authenticateToken,
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);

      if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
          error: 'Invalid request ID'
        });
      }

      // Find the logged-in donor
      const [donors] = await db.query(
        'SELECT id FROM donors WHERE user_id = ?',
        [req.user.id]
      );

      if (donors.length === 0) {
        return res.status(403).json({
          error: 'Only a registered donor can confirm requests'
        });
      }

      const donorId = donors[0].id;

      // Find the request assigned to this donor
      const [requests] = await db.query(
        `SELECT
            id,
            requester_id,
            donor_id,
            blood_group,
            city,
            units,
            status
         FROM blood_requests
         WHERE id = ? AND donor_id = ?`,
        [requestId, donorId]
      );

      if (requests.length === 0) {
        return res.status(404).json({
          error: 'Blood request not found for your account'
        });
      }

      const request = requests[0];

      if (request.status !== 'Pending') {
        return res.status(400).json({
          error: 'This request has already been processed'
        });
      }

      // Update the request status
      const [updateResult] = await db.query(
        `UPDATE blood_requests
         SET status = 'Confirmed'
         WHERE id = ?
           AND donor_id = ?
           AND status = 'Pending'`,
        [requestId, donorId]
      );

      if (updateResult.affectedRows === 0) {
        return res.status(409).json({
          error: 'This request has already been processed'
        });
      }

      // Save the confirmed request in Donation History
      await db.query(
        `INSERT INTO donation_history
         (donor_id, requester_id, blood_request_id,
          blood_group, city, units, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Confirmed')`,
        [
          donorId,
          request.requester_id,
          request.id,
          request.blood_group,
          request.city,
          request.units
        ]
      );

      // Notify the user who sent the request
      await db.query(
        `INSERT INTO notifications
         (user_id, title, message, type, is_read)
         VALUES (?, ?, ?, ?, 0)`,
        [
          request.requester_id,
          'Blood Request Confirmed',
          `Your request for ${request.units} unit(s) of ${request.blood_group} blood in ${request.city} has been confirmed by the donor.`,
          'blood_request_confirmed'
        ]
      );

      res.json({
        message: 'Blood request confirmed successfully',
        requestId: request.id
      });

    } catch (err) {
      console.error('Blood request confirmation error:', err);

      res.status(500).json({
        error: 'Server error while confirming blood request'
      });
    }
  }
);

module.exports = router;

