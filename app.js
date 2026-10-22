/* =========================================================
   HEALTHCONNECT FRONTEND APPLICATION
   =========================================================

   IMPORTANT:
   This frontend is connected to the Node.js + MySQL backend.

   localStorage is used only as frontend state/cache.
   Backend APIs and MySQL are the source of persistent data.

========================================================= */


/* =========================================================
   APPLICATION STATE
========================================================= */

const APP_KEY = "healthconnect_app_v1";


/* =========================================================
   BACKEND API HELPER
========================================================= */


/* =========================================================
   BACKEND API HELPERS
========================================================= */


/* =========================================================
   HEALTHCONNECT BACKEND API HELPERS
========================================================= */

const API_BASE = "http://localhost:5000/api";

async function apiRequest(method, path, body) {
    const token = localStorage.getItem("hc_token");

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, options);
    } catch (error) {
        console.error("Backend connection failed:", error);
        throw new Error(
            "Cannot connect to HealthConnect backend. Check that the server is running on port 5000."
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(`Invalid server response: ${response.status}`);
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `API request failed: ${response.status}`
        );
    }

    return data;
}

async function apiGet(path) {
    return apiRequest("GET", path);
}

async function apiPost(path, body) {
    return apiRequest("POST", path, body);
}

async function apiPut(path, body) {
    return apiRequest("PUT", path, body);
}

async function apiDelete(path) {
    return apiRequest("DELETE", path);
}

const defaultState = {

    loggedIn: false,

    role: "user",

    user: {

        name: "Rahul",

        email: "rahul@example.com",

        phone: "",

        city: "Mumbai",

        bloodGroup: "",

        address: ""

    },


    donor: {

        name: "Donor Account",

        email: "",

        phone: "",

        city: "",

        bloodGroup: "",

        available: true

    },


    pharmacy: {

        name: "Medical Store",

        owner: "",

        email: "",

        phone: "",

        city: "",

        address: ""

    },


    oxygen: {

        name: "Oxygen Provider",

        owner: "",

        email: "",

        phone: "",

        city: "",

        address: ""

    },


    doctor: {

        name: "Doctor Account",

        specialization: "",

        qualification: "",

        email: "",

        phone: "",

        city: "",

        experience: "",

        available: true

    },


    hospital: {

        name: "Hospital Account",

        address: "",

        city: "",

        phone: "",

        email: "",

        beds: 0,

        availableBeds: 0

    },


    bloodRecords: [],

    medicineRecords: [],

    oxygenRecords: [],

    doctors: [],

    hospitals: [],

    bloodRequests: [],

    donations: [],

    appointments: [],

    medicineRequests: [],

    oxygenRequests: [],

    notifications: [],

    pharmacyProfile: null,

    oxygenProviderProfile: null,

    oxygenInventory: [],

    settings: {

        emailNotifications: true,

        appointmentReminders: true,

        requestNotifications: true

    }

};


/* =========================================================
   LOAD / SAVE
========================================================= */

function loadState() {

    try {

        const saved =
            localStorage.getItem(APP_KEY);

        if (!saved) {

            return structuredClone(defaultState);

        }

        return mergeState(
            structuredClone(defaultState),
            JSON.parse(saved)
        );

    } catch (error) {

        console.error(error);

        return structuredClone(defaultState);

    }

}


function mergeState(base, saved) {

    Object.keys(saved || {}).forEach(key => {

        if (
            saved[key] &&
            typeof saved[key] === "object" &&
            !Array.isArray(saved[key]) &&
            typeof base[key] === "object" &&
            !Array.isArray(base[key])
        ) {

            base[key] = mergeState(
                base[key],
                saved[key]
            );

        } else {

            base[key] = saved[key];

        }

    });

    return base;

}


let state = loadState();


function saveState() {

    localStorage.setItem(
        APP_KEY,
        JSON.stringify(state)
    );

}
async function requestMedicine(
    medicine,
    city,
    area,
    quantity = 1
) {

    try {

        const result = await apiPost(
            "/medicines/request",
            {
                medicine,
                city,
                area,
                quantity
            }
        );


        if (result.id) {

            toast(
                "Medicine request submitted successfully."
            );

            return true;

        }


        toast(
            result.error ||
            "Could not submit medicine request.",
            "error"
        );

        return false;


    } catch (error) {

        console.error(
            "Medicine request error:",
            error
        );

        toast(
            "Unable to submit medicine request.",
            "error"
        );

        return false;

    }

}
async function requestOxygen(
    oxygenType,
    capacity,
    city,
    quantity = 1
) {

    try {

        const result = await apiPost(
            "/oxygen/request",
            {
                oxygenType,
                capacity,
                city,
                quantity
            }
        );


        if (result.id) {

            toast(
                "Oxygen request submitted successfully."
            );

            return true;

        }


        toast(
            result.error ||
            "Could not submit oxygen request.",
            "error"
        );

        return false;


    } catch (error) {

        console.error(
            "Oxygen request error:",
            error
        );

        toast(
            "Unable to submit oxygen request.",
            "error"
        );

        return false;

    }

}
async function bookDoctorAppointment(
    doctorId,
    appointmentDate,
    appointmentTime,
    reason = ""
) {

    try {

        const result = await apiPost(
            "/doctors/appointment",
            {
                doctorId,
                appointmentDate,
                appointmentTime,
                reason
            }
        );


        if (result.id) {

            toast(
                "Appointment request submitted successfully."
            );

            return true;

        }


        toast(
            result.error ||
            "Could not create appointment.",
            "error"
        );

        return false;


    } catch (error) {

        console.error(
            "Doctor appointment error:",
            error
        );

        toast(
            "Unable to submit appointment request.",
            "error"
        );

        return false;

    }

}
async function loadDatabaseNotifications() {

    try {

        const data =
            await apiGet("/notifications");


        state.notifications =
            (data.notifications || []).map(notification => ({
                ...notification,
                role: state.role,
                read: Boolean(notification.is_read)
            }));


        saveState();


    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

    }

}
async function loadPharmacyMedicines() {

    try {

        const data =
            await apiGet("/pharmacy/medicines");


        state.pharmacyMedicines =
            data.medicines || [];

        state.medicineRecords =
            data.medicines || [];


        saveState();


    } catch (error) {

        console.error(
            "Pharmacy medicines loading error:",
            error
        );

    }

}
async function loadPharmacyProfile() {

    try {

        const data =
            await apiGet("/pharmacy/profile");


        const profile =
            data.pharmacy || data.profile || null;

        if (profile) {

            state.pharmacyProfile =
                profile;

            state.pharmacy = {
                ...state.pharmacy,
                id: profile.id || state.pharmacy.id,
                name: profile.name || state.pharmacy.name,
                owner: profile.owner_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                city: profile.city || "",
                address: profile.address || "",
                available:
                    profile.availability_status
                        ? profile.availability_status === "Available"
                        : state.pharmacy.available !== false
            };

            saveState();

        }


    } catch (error) {

        console.error(
            "Pharmacy profile loading error:",
            error
        );

    }

}
async function addPharmacyMedicine(
    name,
    category,
    quantity,
    price,
    city,
    area
) {

    try {

        const result = await apiPost(
            "/pharmacy/medicines",
            {
                name,
                category,
                quantity,
                price,
                city,
                area
            }
        );


        if (result.id) {

            toast(
                "Medicine added successfully."
            );

            return true;

        }


        toast(
            result.error ||
            "Could not add medicine.",
            "error"
        );

        return false;


    } catch (error) {

        console.error(
            "Add medicine error:",
            error
        );

        toast(
            "Unable to add medicine.",
            "error"
        );

        return false;

    }

}

/* =========================================================
   PHARMACY / OXYGEN / REQUEST / NOTIFICATION BACKEND
========================================================= */

async function updatePharmacyMedicine(id, name, category, quantity, price, city, area) {
    try {
        const result = await apiPut(`/pharmacy/medicines/${id}`, {
            name, category, quantity, price, city, area
        });
        if (result.message && !result.error) {
            toast("Medicine updated successfully.");
            return true;
        }
        toast(result.error || "Could not update medicine.", "error");
        return false;
    } catch (error) {
        console.error("Update medicine error:", error);
        toast("Unable to update medicine.", "error");
        return false;
    }
}

async function deletePharmacyMedicine(id) {
    try {
        const result = await apiDelete(`/pharmacy/medicines/${id}`);
        if (result.message && !result.error) {
            toast("Medicine deleted successfully.");
            return true;
        }
        toast(result.error || "Could not delete medicine.", "error");
        return false;
    } catch (error) {
        console.error("Delete medicine error:", error);
        toast("Unable to delete medicine.", "error");
        return false;
    }
}

async function loadOxygenProviderProfile() {
    try {
        const data = await apiGet("/oxygen-provider/profile");
        const profile =
            data.provider || data.profile || null;

        if (profile) {
            state.oxygenProviderProfile = profile;
            state.oxygen = {
                ...state.oxygen,
                id: profile.id || state.oxygen.id,
                name: profile.name || state.oxygen.name,
                owner: profile.owner_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                city: profile.city || "",
                address: profile.address || "",
                available:
                    profile.availability_status
                        ? profile.availability_status === "Available"
                        : state.oxygen.available !== false
            };
            saveState();
        }
    } catch (error) {
        console.error("Oxygen provider profile loading error:", error);
    }
}

async function saveOxygenProviderProfile(name, owner_name, email, phone, city, address, availability = true) {
    try {
        const result = await apiPost("/oxygen-provider/profile", {
            name, owner_name, email, phone, city, address, availability
        });
        if (result.message && !result.error) {
            toast("Oxygen provider profile saved successfully.");
            return true;
        }
        toast(result.error || "Could not save provider profile.", "error");
        return false;
    } catch (error) {
        console.error("Oxygen provider profile error:", error);
        toast("Unable to save provider profile.", "error");
        return false;
    }
}

async function loadOxygenInventory() {
    try {
        const data = await apiGet("/oxygen-provider/inventory");
        state.oxygenInventory = data.inventory || [];
        state.oxygenRecords = state.oxygenInventory;
        saveState();
    } catch (error) {
        console.error("Oxygen inventory loading error:", error);
    }
}

async function addOxygenInventory(type, capacity, quantity, price, city) {
    try {
        const result = await apiPost("/oxygen-provider/inventory", {
            type, capacity, quantity, price, city
        });
        if (result.id) {
            toast("Oxygen inventory added successfully.");
            await loadOxygenInventory();
            return true;
        }
        toast(result.error || "Could not add oxygen inventory.", "error");
        return false;
    } catch (error) {
        console.error("Add oxygen inventory error:", error);
        toast("Unable to add oxygen inventory.", "error");
        return false;
    }
}

async function updateOxygenInventory(id, type, capacity, quantity, price, city) {
    try {
        const result = await apiPut(`/oxygen-provider/inventory/${id}`, {
            type, capacity, quantity, price, city
        });
        if (result.message && !result.error) {
            toast("Oxygen inventory updated successfully.");
            await loadOxygenInventory();
            return true;
        }
        toast(result.error || "Could not update oxygen inventory.", "error");
        return false;
    } catch (error) {
        console.error("Update oxygen inventory error:", error);
        toast("Unable to update oxygen inventory.", "error");
        return false;
    }
}

async function deleteOxygenInventory(id) {
    try {
        const result = await apiDelete(`/oxygen-provider/inventory/${id}`);
        if (result.message && !result.error) {
            toast("Oxygen inventory deleted successfully.");
            await loadOxygenInventory();
            return true;
        }
        toast(result.error || "Could not delete oxygen inventory.", "error");
        return false;
    } catch (error) {
        console.error("Delete oxygen inventory error:", error);
        toast("Unable to delete oxygen inventory.", "error");
        return false;
    }
}

async function loadUserAppointments() {
    try {
        const data = await apiGet("/doctors/appointments/list");
        state.appointments = data.appointments || [];
        saveState();
    } catch (error) {
        console.error("Appointments loading error:", error);
    }
}

async function loadMedicineRequests() {
    try {
        const data = await apiGet("/medicines/requests");
        state.medicineRequests = data.requests || [];
        saveState();
    } catch (error) {
        console.error("Medicine requests loading error:", error);
    }
}

async function loadOxygenRequests() {
    try {
        const data = await apiGet("/oxygen/requests");
        state.oxygenRequests = data.requests || [];
        saveState();
    } catch (error) {
        console.error("Oxygen requests loading error:", error);
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("hc_token")}`
            }
        });
        const data = await res.json();
        if (!res.ok) {
            toast(data.error || "Could not update notification.", "error");
            return false;
        }
        const notification = state.notifications.find(item => item.id == notificationId);
        if (notification) {
            notification.is_read = 1;
            notification.read = true;
        }
        saveState();
        return true;
    } catch (error) {
        console.error("Mark notification error:", error);
        return false;
    }
}

async function markAllNotificationsAsRead() {
    try {
        const res = await fetch(`${API_BASE}/notifications/read-all`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("hc_token")}`
            }
        });
        const data = await res.json();
        if (!res.ok) {
            toast(data.error || "Could not update notifications.", "error");
            return false;
        }
        state.notifications = state.notifications.map(notification => ({
            ...notification,
            is_read: 1,
            read: true
        }));
        saveState();
        toast("All notifications marked as read.");
        return true;
    } catch (error) {
        console.error("Mark all notifications error:", error);
        return false;
    }
}

async function loadDonorProfile() {
    try {
        const data = await apiGet("/donors/profile");

        const donor = data.donor || null;

        if (!donor) {
            return;
        }

        state.donor = {
            ...state.donor,
            id: donor.id || state.donor.id,
            name: donor.name || state.donor.name,
            email: donor.email || state.donor.email,
            bloodGroup:
                donor.blood_group || state.donor.bloodGroup || "",
            age: donor.age ?? state.donor.age ?? "",
            gender: donor.gender || state.donor.gender || "",
            phone: donor.phone || "",
            city: donor.city || "",
            address: donor.address || "",
            available:
                donor.available ??
                (donor.availability_status === "Available")
        };

        saveState();

    } catch (error) {
        console.error("Donor profile loading error:", error);
    }
}




async function loadDoctorProfileFromDatabase() {
    if (state.role !== "doctor") return;

    try {
        const result = await apiGet("/doctors/profile");
        if (!result || !result.doctor) return;

        const doctor = result.doctor;
        state.doctor = {
            ...state.doctor,
            id: doctor.id,
            name: doctor.name || "",
            specialization: doctor.specialization || "",
            qualification: doctor.qualification || "",
            experience: doctor.experience || "",
            email: doctor.email || "",
            phone: doctor.phone || "",
            city: doctor.city || "",
            available: doctor.available ?? (doctor.availability_status === "Available")
        };
        saveState();
    } catch (error) {
        console.error("Doctor profile loading error:", error);
    }
}

async function loadHospitalProfileFromDatabase() {
    if (state.role !== "hospital") return;

    try {
        const result = await apiGet("/hospitals/profile");
        if (!result || !result.hospital) return;

        const hospital = result.hospital;
        state.hospital = {
            ...state.hospital,
            id: hospital.id,
            name: hospital.name || "",
            address: hospital.address || "",
            city: hospital.city || "",
            phone: hospital.phone || "",
            email: hospital.email || "",
            beds: hospital.beds ?? 0,
            availableBeds: hospital.available_beds ?? 0,
            available: hospital.available ?? (hospital.availability_status === "Available")
        };
        saveState();
    } catch (error) {
        console.error("Hospital profile loading error:", error);
    }
}
async function loadDonorProfile() {

    if (state.role !== "donor") {
        return;
    }

    try {

        const data =
            await apiGet(
                "/donors/profile"
            );

        if (
            data &&
            data.donor
        ) {

            const d =
                data.donor;

            state.donor = {

                ...state.donor,

                id:
                    d.id,

                name:
                    d.name ||
                    state.donor.name,

                email:
                    d.email ||
                    state.donor.email,

                phone:
                    d.phone ||
                    "",

                city:
                    d.city ||
                    "",

                bloodGroup:
                    d.blood_group ||
                    "",

                age:
                    d.age ||
                    "",

                gender:
                    d.gender ||
                    "",

                address:
                    d.address ||
                    "",

                available:
                    d.available

            };

            saveState();

        }

    } catch (error) {

        console.error(
            "Donor profile loading error:",
            error
        );

    }

}
async function loadBackendData() {

    if (!localStorage.getItem("hc_token")) {
        return;
    }

    try {
        await Promise.all([
    loadDonorProfile(),
    loadBloodRequests(),
    loadDatabaseNotifications(),
    loadMedicineRequests(),
    loadOxygenRequests(),
    loadUserAppointments(),
    loadPharmacyProfile(),
    loadPharmacyMedicines(),
    loadOxygenProviderProfile(),
    loadOxygenInventory()
]);
    } catch (error) {
        console.error("Backend data loading error:", error);
    }
}

async function loadBloodRequests() {
    try {
        const data = await apiGet("/blood/requests");

        state.bloodRequests = (data.requests || []).map(request => ({
            ...request,
            bloodGroup: request.blood_group || request.bloodGroup || "",
            units: request.units ?? 1,
            city: request.city || "",
            urgency: request.urgency || "Normal",
            status: request.status || "Pending",
            date: request.created_at
                ? new Date(request.created_at).toLocaleString()
                : (request.date || "Recently")
        }));

        saveState();
    } catch (error) {
        console.error("Blood requests loading error:", error);
    }
}

/* =========================================================
   LOAD USER PROFILE FROM DATABASE
========================================================= */

async function loadUserProfileFromDatabase() {

    try {

        // Only the user role is connected to the backend
        if (state.role !== "user") {
            return;
        }


        // Get JWT token
        const token =
            localStorage.getItem("hc_token");


        if (!token) {

            console.log(
                "No authentication token found."
            );

            return;

        }


        // Call backend
        const result =
            await apiGet(
                "/users/profile"
            );


        if (
            !result ||
            !result.user
        ) {

            console.error(
                "Unable to load user profile:",
                result
            );

            return;

        }


        const user =
            result.user;


        /* -----------------------------------------
           Update application state
        ----------------------------------------- */

        state.user = {

            ...state.user,

            id:
                user.id,

            name:
                user.name || "",

            email:
                user.email || "",

            phone:
                user.phone || "",

            city:
                user.city || "",

            bloodGroup:
                user.blood_group || "",

            address:
                user.address || ""

        };


        /* -----------------------------------------
           Save latest database information locally
           as application cache.
           
           MySQL remains the actual source.
        ----------------------------------------- */

        saveState();


        console.log(
            "User profile loaded from database:",
            user
        );


    } catch (error) {

        console.error(
            "Error loading user profile:",
            error
        );

    }

}


/* =========================================================
   BASIC HELPERS
========================================================= */

function esc(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function id() {

    return Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8);

}


function today() {

    return new Date()
        .toISOString()
        .slice(0, 10);

}


function timeNow() {

    return new Date()
        .toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}


function toast(message, type = "success") {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const item =
        document.createElement("div");

    item.className =
        `toast ${type}`;

    item.innerHTML =
        `<i class="fa-solid ${
            type === "error"
                ? "fa-circle-exclamation"
                : "fa-circle-check"
        }"></i> ${esc(message)}`;

    container.appendChild(item);

    setTimeout(() => {

        item.remove();

    }, 3000);

}


/* =========================================================
   ROLE INFORMATION
========================================================= */

const roles = {

    user: {
        name: "Patient / User",
        icon: "fa-user",
        subtitle: "HealthConnect User"
    },

    donor: {
        name: "Donor",
        icon: "fa-hand-holding-droplet",
        subtitle: "HealthConnect Donor"
    },

    pharmacy: {
        name: "Medical Store",
        icon: "fa-prescription-bottle-medical",
        subtitle: "Pharmacy Account"
    },

    oxygen: {
        name: "Oxygen Provider",
        icon: "fa-lungs",
        subtitle: "Oxygen Provider Account"
    },

    doctor: {
        name: "Doctor",
        icon: "fa-user-doctor",
        subtitle: "Doctor Account"
    },

    hospital: {
        name: "Hospital",
        icon: "fa-hospital",
        subtitle: "Hospital Account"
    }

};


/* =========================================================
   PAGE CONFIGURATION
========================================================= */

const pageConfig = {

    user: {

        dashboard: {
            title: "Dashboard",
            icon: "fa-house"
        },

        blood: {
            title: "Find Blood",
            icon: "fa-droplet"
        },

        medicine: {
            title: "Find Medicine",
            icon: "fa-pills"
        },

        oxygen: {
            title: "Find Oxygen",
            icon: "fa-lungs"
        },

        doctors: {
            title: "Find Doctors",
            icon: "fa-user-doctor"
        },

        hospitals: {
            title: "Find Hospitals",
            icon: "fa-hospital"
        },

        emergency: {
            title: "Emergency",
            icon: "fa-truck-medical"
        },

        "donor-register": {
            title: "Become a Blood Donor",
            icon: "fa-hand-holding-droplet"
        },

        profile: {
            title: "My Profile",
            icon: "fa-user"
        },

        notifications: {
            title: "Notifications",
            icon: "fa-bell"
        },

        settings: {
            title: "Settings",
            icon: "fa-gear"
        }

    },


    donor: {

        dashboard: {
            title: "Donor Dashboard",
            icon: "fa-chart-line"
        },

        requests: {
            title: "Blood Requests",
            icon: "fa-droplet"
        },

        history: {
            title: "Donation History",
            icon: "fa-clock-rotate-left"
        },

        availability: {
            title: "Availability",
            icon: "fa-circle-check"
        },

        profile: {
            title: "Donor Profile",
            icon: "fa-user"
        },

        certificate: {
            title: "Donation Certificate",
            icon: "fa-certificate"
        },

        notifications: {
            title: "Notifications",
            icon: "fa-bell"
        },

        settings: {
            title: "Donor Settings",
            icon: "fa-gear"
        }

    },


    pharmacy: {

        dashboard: {
            title: "Medical Store Dashboard",
            icon: "fa-store"
        },

        profile: {
            title: "Store Profile",
            icon: "fa-store"
        },

        inventory: {
            title: "Medicine Inventory",
            icon: "fa-pills"
        },

        requests: {
            title: "Medicine Requests",
            icon: "fa-file-medical"
        },

        availability: {
            title: "Availability",
            icon: "fa-circle-check"
        },

        orders: {
            title: "Orders",
            icon: "fa-cart-shopping"
        },

        notifications: {
            title: "Notifications",
            icon: "fa-bell"
        },

        settings: {
            title: "Settings",
            icon: "fa-gear"
        }

    },


    oxygen: {

        dashboard: {
            title: "Oxygen Provider Dashboard",
            icon: "fa-lungs"
        },

        profile: {
            title: "Provider Profile",
            icon: "fa-user"
        },

        inventory: {
            title: "Oxygen Inventory",
            icon: "fa-lungs"
        },

        requests: {
            title: "Oxygen Requests",
            icon: "fa-file-medical"
        },

        availability: {
            title: "Availability",
            icon: "fa-circle-check"
        },

        orders: {
            title: "Orders",
            icon: "fa-cart-shopping"
        },

        notifications: {
            title: "Notifications",
            icon: "fa-bell"
        },

        settings: {
            title: "Settings",
            icon: "fa-gear"
        }

    },


    doctor: {

        dashboard: {
            title: "Doctor Dashboard",
            icon: "fa-user-doctor"
        },

        profile: {
            title: "Doctor Profile",
            icon: "fa-user"
        },

        appointments: {
            title: "Appointments",
            icon: "fa-calendar-check"
        },

        patients: {
            title: "Patients",
            icon: "fa-users"
        },

        availability: {
            title: "Availability",
            icon: "fa-circle-check"
        },

        requests: {
            title: "Consultation Requests",
            icon: "fa-file-medical"
        },

        notifications: {
            title: "Notifications",
            icon: "fa-bell"
        },

        settings: {
            title: "Settings",
            icon: "fa-gear"
        }

    },


    hospital: {

        dashboard: {
            title: "Hospital Dashboard",
            icon: "fa-hospital"
        },

        profile: {
            title: "Hospital Profile",
            icon: "fa-hospital-user"
        },

        blood: {
            title: "Blood Stock",
            icon: "fa-droplet"
        },

        oxygen: {
            title: "Oxygen Stock",
            icon: "fa-lungs"
        },

        beds: {
            title: "Bed Availability",
            icon: "fa-bed"
        },

        doctors: {
            title: "Doctor Management",
            icon: "fa-user-doctor"
        },

        requests: {
            title: "Requests",
            icon: "fa-file-medical"
        },

        notifications: {
            title: "Notifications",
            icon: "fa-bell"
        },

        settings: {
            title: "Settings",
            icon: "fa-gear"
        }

    }

};


/* =========================================================
   LOGIN
========================================================= */

let selectedRole = "user";

let authMode = "login";


function renderLogin() {

    document.getElementById("app").innerHTML = `

        <div class="login-page">

            <div class="login-card">

                <div class="brand">

                    <div class="logo-icon">
                        <i class="fa-solid fa-heart-pulse"></i>
                    </div>

                    <strong>HealthConnect</strong>

                </div>


                <div class="login-title">

                    <h1>Welcome back</h1>

                    <p>
                        Choose your account type to continue.
                    </p>

                </div>


                <div class="role-grid">

                    ${Object.entries(roles)
                        .map(([key, role]) => `

                            <button
                                type="button"
                                class="role-option ${
                                    key === selectedRole
                                        ? "selected"
                                        : ""
                                }"
                                data-role="${key}"
                            >

                                <i class="fa-solid ${role.icon}"></i>

                                <span>
                                    ${role.name}
                                </span>

                                <small>
                                    ${role.subtitle}
                                </small>

                            </button>

                        `)
                        .join("")}

                </div>


                ${
                    authMode === "register"
                        ? `

                            <form
                                id="registerForm"
                                class="login-form"
                            >

                                <div class="form-group">

                                    <label>Full Name</label>

                                    <input
                                        id="registerName"
                                        type="text"
                                        placeholder="Enter your name"
                                        required
                                    >

                                </div>


                                <div class="form-group">

                                    <label>Email</label>

                                    <input
                                        id="registerEmail"
                                        type="email"
                                        placeholder="Enter email"
                                        required
                                    >

                                </div>


                                <div class="form-group">

                                    <label>Password</label>

                                    <input
                                        id="registerPassword"
                                        type="password"
                                        placeholder="Create a password"
                                        required
                                        minlength="6"
                                    >

                                </div>


                                <div class="form-group">

                                    <label>Phone</label>

                                    <input
                                        id="registerPhone"
                                        type="text"
                                        placeholder="Enter phone number"
                                    >

                                </div>


                                <div class="form-group">

                                    <label>City</label>

                                    <input
                                        id="registerCity"
                                        type="text"
                                        placeholder="Enter your city"
                                    >

                                </div>


                                <button
                                    class="btn btn-primary"
                                    type="submit"
                                >

                                    <i class="fa-solid fa-user-plus"></i>

                                    Create Account

                                </button>

                            </form>


                            <div class="login-demo">

                                Already have an account?
                                <a
                                    href="#"
                                    data-toggle-auth="login"
                                >
                                    Sign in here
                                </a>

                            </div>

                        `
                        : `

                            <form
                                id="loginForm"
                                class="login-form"
                            >

                                <div class="form-group">

                                    <label>Email</label>

                                    <input
                                        id="loginEmail"
                                        type="email"
                                        placeholder="Enter email"
                                        required
                                        value=""
                                    >

                                </div>


                                <div class="form-group">

                                    <label>Password</label>

                                    <input
                                        id="loginPassword"
                                        type="password"
                                        placeholder="Enter password"
                                        required
                                        value=""
                                    >

                                </div>


                                <button
                                    class="btn btn-primary"
                                    type="submit"
                                >

                                    <i class="fa-solid fa-right-to-bracket"></i>

                                    Sign In

                                </button>

                            </form>


                            <div class="login-demo">

                                New here?
                                <a
                                    href="#"
                                    data-toggle-auth="register"
                                >
                                    Create an account
                                </a>

                            </div>

                        `
                }

            </div>

        </div>

    `;


    document
        .querySelectorAll("[data-role]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedRole =
                        button.dataset.role;

                    authMode = "login";

                    renderLogin();

                }
            );

        });


    const loginFormEl =
        document.getElementById("loginForm");

    if (loginFormEl) {

        loginFormEl.addEventListener(
            "submit",
            handleLogin
        );

    }


    const registerFormEl =
        document.getElementById("registerForm");

    if (registerFormEl) {

        registerFormEl.addEventListener(
            "submit",
            handleRegister
        );

    }


    document
        .querySelectorAll("[data-toggle-auth]")
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    authMode =
                        link.dataset.toggleAuth;

                    renderLogin();

                }
            );

        });

}


async function handleRegister(event) {

    event.preventDefault();

    const name =
        document.getElementById(
            "registerName"
        ).value.trim();

    const email =
        document.getElementById(
            "registerEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "registerPassword"
        ).value;

    const phone =
        document.getElementById(
            "registerPhone"
        ).value.trim();

    const city =
        document.getElementById(
            "registerCity"
        ).value.trim();

    const result =
        await apiPost(
            "/auth/register",
            {
                name,
                email,
                password,
                phone,
                city,
                role: selectedRole
            }
        );

    if (result.message) {

        toast(
            "Account created successfully. Please sign in."
        );

        authMode = "login";

        renderLogin();

        const emailField =
            document.getElementById(
                "loginEmail"
            );

        if (emailField) {

            emailField.value = email;

        }

    } else {

        toast(
            result.error || "Registration failed",
            "error"
        );

    }

}



async function handleLogin(event) {
    event.preventDefault();

    const form = document.getElementById("loginForm");

    try {
        let result;

        // STEP 1: Verify OTP
        if (form.dataset.otpStage === "true") {
            const email = form.dataset.otpEmail;
            const otp = document.getElementById("loginOtp").value.trim();

            if (!/^\d{6}$/.test(otp)) {
                toast("Enter the 6-digit OTP.", "error");
                return;
            }

            result = await apiPost("/auth/verify-otp", {
                email,
                otp
            });

            if (!result.token || !result.user) {
                toast("OTP verification failed.", "error");
                return;
            }

        } else {
            // STEP 2: Check login credentials and send OTP
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;

            result = await apiPost("/auth/login", {
                email,
                password,
                role: selectedRole
            });

            if (!result.otpRequired) {
                toast("Could not start email verification.", "error");
                return;
            }

            // Display OTP input using the existing login form
            form.dataset.otpStage = "true";
            form.dataset.otpEmail = email;

            form.innerHTML = `
                <div class="form-group">
                    <label>Verification Code</label>
                    <p>Enter the 6-digit code sent to your email.</p>
                    <input
                        id="loginOtp"
                        type="text"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        maxlength="6"
                        pattern="[0-9]{6}"
                        placeholder="Enter 6-digit OTP"
                        required
                        autofocus
                    >
                </div>

                <button class="btn btn-primary" type="submit">
                    <i class="fa-solid fa-shield-halved"></i>
                    Verify OTP & Sign In
                </button>

                <p style="margin-top:12px;text-align:center">
                    Check your inbox and spam folder.
                </p>
            `;

            document.getElementById("loginOtp").focus();
            toast(result.message || "OTP sent to your email.");
            return;
        }

        // STEP 3: Save token only after OTP verification
        localStorage.setItem("hc_token", result.token);

        state.loggedIn = true;
        state.role = result.user.role;

        const roleData = state[state.role];

        if (roleData) {
            roleData.email = result.user.email || "";
            roleData.name = result.user.name || "";

            if (result.user.phone !== undefined) {
                roleData.phone = result.user.phone;
            }

            if (result.user.city !== undefined) {
                roleData.city = result.user.city;
            }
        }

        state.user.email = result.user.email || "";
        state.user.name = result.user.name || "";

        saveState();

        await loadBackendData();

        if (state.role === "user") {
            await loadUserProfileFromDatabase();
        }

        navigate("dashboard");
        toast("Email verified. Welcome to HealthConnect!");

    } catch (error) {
        console.error("Login/OTP error:", error);
        toast(error.message || "Login or OTP verification failed.", "error");
    }
}



/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    state.loggedIn = false;

    localStorage.removeItem(
        "hc_token"
    );

    saveState();

    selectedRole = "user";

    renderLogin();

    toast("You have been logged out.");

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(page = "dashboard") {

    if (!state.loggedIn) {

        renderLogin();

        return;

    }


    const role =
        state.role;


    const config =
        pageConfig[role];


    if (!config[page]) {

        page = "dashboard";

    }


    const hash =
        `#${role}/${page}`;


    if (location.hash !== hash) {

        history.pushState(
            null,
            "",
            hash
        );

    }


    renderApp(page);

}


window.addEventListener(
    "popstate",
    handleRoute
);


window.addEventListener(
    "hashchange",
    handleRoute
);


function handleRoute() {

    if (!state.loggedIn) {

        renderLogin();

        return;

    }


    const parts =
        location.hash
            .replace("#", "")
            .split("/");


    const role =
        parts[0];


    const page =
        parts[1] || "dashboard";


    if (
        roles[role] &&
        pageConfig[role]
    ) {

        state.role = role;

        saveState();

        renderApp(page);

    } else {

        navigate("dashboard");

    }

}


/* =========================================================
   APPLICATION SHELL
========================================================= */

function renderApp(page) {

    const role =
        state.role;

    const roleInfo =
        roles[role];

    const config =
        pageConfig[role][page];


    document.getElementById("app").innerHTML = `

        <div class="app-shell">

            ${renderSidebar(role, page)}

            <main class="main">

                ${renderTopbar(config, roleInfo)}

                <section class="content">

                    ${renderPage(role, page)}

                </section>

            </main>

        </div>

    `;


    bindApplicationEvents();

}


/* =========================================================
   SIDEBAR
========================================================= */

function navButton(
    page,
    icon,
    label,
    active
) {

    return `

        <button
            class="nav-item ${
                active === page
                    ? "active"
                    : ""
            }"
            data-nav="${page}"
            type="button"
        >

            <i class="fa-solid ${icon}"></i>

            <span>${label}</span>

        </button>

    `;

}


function renderSidebar(role, active) {

    let html = `

        <aside
            class="sidebar"
            id="sidebar"
        >

            <div class="sidebar-logo">

                <div class="logo-icon">

                    <i class="fa-solid fa-heart-pulse"></i>

                </div>

                <span>HealthConnect</span>

            </div>


            <div class="sidebar-scroll">
    `;


    if (role === "user") {

        html += `

            <div class="nav-title">
                HEALTHCARE
            </div>

            ${navButton(
                "dashboard",
                "fa-house",
                "Dashboard",
                active
            )}

            ${navButton(
                "blood",
                "fa-droplet",
                "Find Blood",
                active
            )}

            ${navButton(
                "medicine",
                "fa-pills",
                "Find Medicine",
                active
            )}

            ${navButton(
                "oxygen",
                "fa-lungs",
                "Find Oxygen",
                active
            )}

            ${navButton(
                "doctors",
                "fa-user-doctor",
                "Find Doctors",
                active
            )}

            ${navButton(
                "hospitals",
                "fa-hospital",
                "Find Hospitals",
                active
            )}

            ${navButton(
                "donor-register",
                "fa-hand-holding-droplet",
                "Become a Blood Donor",
                active
            )}

            <button
                class="nav-item emergency"
                data-nav="emergency"
                type="button"
            >

                <i class="fa-solid fa-truck-medical"></i>

                <span>Emergency</span>

            </button>


            <div class="nav-title">
                MY ACCOUNT
            </div>

            ${navButton(
                "profile",
                "fa-user",
                "My Profile",
                active
            )}

            ${navButton(
                "notifications",
                "fa-bell",
                "Notifications",
                active
            )}

            ${navButton(
                "settings",
                "fa-gear",
                "Settings",
                active
            )}

        `;

    }


    if (role === "donor") {

        html += `

            <div class="nav-title">
                HEALTHCARE
            </div>

            ${navButton(
                "dashboard",
                "fa-house",
                "Dashboard",
                active
            )}

            <div class="nav-title">
                DONOR
            </div>

            ${navButton(
                "requests",
                "fa-droplet",
                "Blood Requests",
                active
            )}

            ${navButton(
                "history",
                "fa-clock-rotate-left",
                "Donation History",
                active
            )}

            ${navButton(
                "availability",
                "fa-circle-check",
                "Availability",
                active
            )}

            ${navButton(
                "profile",
                "fa-user",
                "Donor Profile",
                active
            )}

            ${navButton(
                "certificate",
                "fa-certificate",
                "Donation Certificate",
                active
            )}

            <div class="nav-title">
                ACCOUNT
            </div>

            ${navButton(
                "notifications",
                "fa-bell",
                "Notifications",
                active
            )}

            ${navButton(
                "settings",
                "fa-gear",
                "Settings",
                active
            )}

        `;

    }


    if (role === "pharmacy") {

        html += `

            <div class="nav-title">
                PHARMACY / MEDICAL STORE
            </div>

            ${navButton(
                "dashboard",
                "fa-house",
                "Dashboard",
                active
            )}

            ${navButton(
                "profile",
                "fa-store",
                "Store Profile",
                active
            )}

            ${navButton(
                "inventory",
                "fa-pills",
                "Medicine Inventory",
                active
            )}

            ${navButton(
                "requests",
                "fa-file-medical",
                "Medicine Requests",
                active
            )}

            ${navButton(
                "availability",
                "fa-circle-check",
                "Availability",
                active
            )}

            ${navButton(
                "orders",
                "fa-cart-shopping",
                "Orders",
                active
            )}

            <div class="nav-title">
                ACCOUNT
            </div>

            ${navButton(
                "notifications",
                "fa-bell",
                "Notifications",
                active
            )}

            ${navButton(
                "settings",
                "fa-gear",
                "Settings",
                active
            )}

        `;

    }


    if (role === "oxygen") {

        html += `

            <div class="nav-title">
                OXYGEN PROVIDER
            </div>

            ${navButton(
                "dashboard",
                "fa-house",
                "Dashboard",
                active
            )}

            ${navButton(
                "profile",
                "fa-user",
                "Provider Profile",
                active
            )}

            ${navButton(
                "inventory",
                "fa-lungs",
                "Oxygen Inventory",
                active
            )}

            ${navButton(
                "requests",
                "fa-file-medical",
                "Oxygen Requests",
                active
            )}

            ${navButton(
                "availability",
                "fa-circle-check",
                "Availability",
                active
            )}

            ${navButton(
                "orders",
                "fa-cart-shopping",
                "Orders",
                active
            )}

            <div class="nav-title">
                ACCOUNT
            </div>

            ${navButton(
                "notifications",
                "fa-bell",
                "Notifications",
                active
            )}

            ${navButton(
                "settings",
                "fa-gear",
                "Settings",
                active
            )}

        `;

    }


    if (role === "doctor") {

        html += `

            <div class="nav-title">
                DOCTOR
            </div>

            ${navButton(
                "dashboard",
                "fa-house",
                "Dashboard",
                active
            )}

            ${navButton(
                "profile",
                "fa-user",
                "Doctor Profile",
                active
            )}

            ${navButton(
                "appointments",
                "fa-calendar-check",
                "Appointments",
                active
            )}

            ${navButton(
                "patients",
                "fa-users",
                "Patients",
                active
            )}

            ${navButton(
                "availability",
                "fa-circle-check",
                "Availability",
                active
            )}

            ${navButton(
                "requests",
                "fa-file-medical",
                "Consultation Requests",
                active
            )}

            <div class="nav-title">
                ACCOUNT
            </div>

            ${navButton(
                "notifications",
                "fa-bell",
                "Notifications",
                active
            )}

            ${navButton(
                "settings",
                "fa-gear",
                "Settings",
                active
            )}

        `;

    }


    if (role === "hospital") {

        html += `

            <div class="nav-title">
                HOSPITAL
            </div>

            ${navButton(
                "dashboard",
                "fa-house",
                "Dashboard",
                active
            )}

            ${navButton(
                "profile",
                "fa-hospital-user",
                "Hospital Profile",
                active
            )}

            ${navButton(
                "blood",
                "fa-droplet",
                "Blood Stock",
                active
            )}

            ${navButton(
                "oxygen",
                "fa-lungs",
                "Oxygen Stock",
                active
            )}

            ${navButton(
                "beds",
                "fa-bed",
                "Bed Availability",
                active
            )}

            ${navButton(
                "doctors",
                "fa-user-doctor",
                "Doctor Management",
                active
            )}

            ${navButton(
                "requests",
                "fa-file-medical",
                "Requests",
                active
            )}

            <div class="nav-title">
                ACCOUNT
            </div>

            ${navButton(
                "notifications",
                "fa-bell",
                "Notifications",
                active
            )}

            ${navButton(
                "settings",
                "fa-gear",
                "Settings",
                active
            )}

        `;

    }


    html += `

            </div>


            <div class="sidebar-bottom">

                <button
                    class="nav-item"
                    data-switch-role
                    type="button"
                >

                    <i class="fa-solid fa-repeat"></i>

                    <span>Switch Account</span>

                </button>


                <button
                    class="nav-item"
                    data-logout
                    type="button"
                >

                    <i class="fa-solid fa-right-from-bracket"></i>

                    <span>Logout</span>

                </button>

            </div>

        </aside>

    `;


    return html;

}


/* =========================================================
   TOPBAR
========================================================= */

function renderTopbar(config, roleInfo) {

    const role =
        state.role;

    const account =
        state[role] || {};


    const displayName =
        account.name ||
        roleInfo.name;


    const unread =
        state.notifications.filter(
            item =>
                item.role === role &&
                !item.read
        ).length;


    return `

        <header class="topbar">

            <div class="topbar-left">

                <button
                    class="menu-button"
                    id="menuButton"
                    type="button"
                >

                    <i class="fa-solid fa-bars"></i>

                </button>


                <div class="page-title">

                    <i class="fa-solid ${config.icon}"></i>

                    <span>${config.title}</span>

                </div>

            </div>


            <div class="topbar-right">

                <div class="search-box">

                    <i class="fa-solid fa-magnifying-glass"></i>

                    <input
                        id="globalSearch"
                        type="search"
                        placeholder="Search healthcare resources..."
                    >

                </div>


                <button
                    class="icon-button"
                    data-nav="notifications"
                    type="button"
                >

                    <i class="fa-regular fa-bell"></i>

                    ${
                        unread
                            ? `<span class="notification-dot"></span>`
                            : ""
                    }

                </button>


                <div class="user-menu">

                    <div class="avatar">

                        <i class="fa-solid ${roleInfo.icon}"></i>

                    </div>

                    <div>

                        <strong>
                            ${esc(displayName)}
                        </strong>

                        <small>
                            ${roleInfo.subtitle}
                        </small>

                    </div>

                </div>

            </div>

        </header>

    `;

}


/* =========================================================
   PAGE ROUTER
========================================================= */

function renderPage(role, page) {

    if (role === "user") {

        return renderUserPage(page);

    }

    if (role === "donor") {

        return renderDonorPage(page);

    }

    if (role === "pharmacy") {

        return renderPharmacyPage(page);

    }

    if (role === "oxygen") {

        return renderOxygenPage(page);

    }

    if (role === "doctor") {

        return renderDoctorPage(page);

    }

    if (role === "hospital") {

        return renderHospitalPage(page);

    }

    return renderNotFound();

}


function renderNotFound() {

    return `

        <div class="empty">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>Page not found</h3>

            <p>
                The requested interface does not exist.
            </p>

        </div>

    `;

}


/* =========================================================
   USER DASHBOARD
========================================================= */

function renderUserPage(page) {

    switch (page) {

        case "dashboard":
            return userDashboard();

        case "blood":
            return bloodSearchPage();

        case "medicine":
            return medicineSearchPage();

        case "oxygen":
            return oxygenSearchPage();

        case "doctors":
            return doctorSearchPage();

        case "hospitals":
            return hospitalSearchPage();

        case "emergency":
            return emergencyPage();

        case "donor-register":
            return donorRegistrationPage();    

        case "profile":
            return profilePage("user");

        case "notifications":
            return notificationsPage();

        case "settings":
            return settingsPage();
        
        default:
            return userDashboard();

    }

}


/* =========================================================
   USER DASHBOARD HTML
========================================================= */

function userDashboard() {

    const user =
        state.user;


    return `

        <div class="welcome-row">

            <div class="page-heading">

                <div class="eyebrow">
                    HEALTHCARE ASSISTANCE
                </div>

                <h1>
                    Hello, ${esc(user.name)} 👋
                </h1>

                <p>
                    What healthcare resource are you looking for today?
                </p>

            </div>


            <div class="location-card">

                <i class="fa-solid fa-location-dot"></i>

                <div>

                    <small>Your location</small>

                    <strong>
                        ${esc(user.city || "Not Added")}
                    </strong>

                </div>

            </div>

        </div>


        <div class="card">

            <div class="card-header">

                <div>

                    <h2>
                        Find Healthcare Resources
                    </h2>

                    <p>
                        Search for blood, medicine, oxygen,
                        doctors and hospitals.
                    </p>

                </div>

                <i
                    class="fa-solid fa-magnifying-glass"
                    style="color:var(--blue)"
                ></i>

            </div>


            <form
                id="dashboardSearch"
                class="search-form"
            >

                <div class="form-group full">

                    <label>
                        What are you looking for?
                    </label>

                    <input
                        name="query"
                        placeholder="e.g. O+ blood, Paracetamol, Cardiologist..."
                    >

                </div>


                <button
                    class="btn btn-primary search-button"
                    type="submit"
                >

                    <i class="fa-solid fa-magnifying-glass"></i>

                    Search

                </button>

            </form>

        </div>


        <div class="section">

            <div class="section-title">

                <div class="eyebrow">
                    HEALTHCARE SERVICES
                </div>

                <h2>
                    What do you need?
                </h2>

            </div>


            <div class="grid grid-3">

                ${serviceCard(
                    "blood",
                    "fa-droplet",
                    "Find Blood",
                    "Search blood donors and blood banks by blood group and location.",
                    "red"
                )}

                ${serviceCard(
                    "medicine",
                    "fa-pills",
                    "Find Medicine",
                    "Find medicines available at nearby pharmacies.",
                    "green"
                )}

                ${serviceCard(
                    "oxygen",
                    "fa-lungs",
                    "Find Oxygen",
                    "Search for oxygen cylinders and concentrators.",
                    "blue"
                )}
                
                ${serviceCard(
                    "doctors",
                    "fa-user-doctor",
                    "Find Doctors",
                    "Find doctors by specialization and location.",
                    "purple"
                )}

                ${serviceCard(
                    "hospitals",
                    "fa-hospital",
                    "Find Hospitals",
                    "Find hospitals and healthcare facilities near you.",
                    "blue"
                )}

                ${serviceCard(
                    "emergency",
                    "fa-truck-medical",
                    "Emergency",
                    "Quick access to emergency healthcare information.",
                    "red"
                )}
                ${serviceCard(
                    "donor-register",
                    "fa-hand-holding-droplet",
                    "Become a Blood Donor",
                    "Register as a blood donor and help people in need.",
                    "red"
                )}
            </div>

        </div>

    `;

}


function serviceCard(
    page,
    icon,
    title,
    description,
    color
) {

    return `

        <div
            class="card service-card"
            data-nav="${page}"
            role="button"
            tabindex="0"
            onclick="navigate('${page}')"
        >

            <div
                class="service-icon"
                style="
                    background:rgba(31,111,235,.12);
                    color:var(--${color === "red"
                        ? "red"
                        : color === "green"
                            ? "green-light"
                            : color === "purple"
                                ? "purple"
                                : "blue"});
                "
            >

                <i class="fa-solid ${icon}"></i>

            </div>

            <h3>
                ${title}
            </h3>

            <p>
                ${description}
            </p>

            <div class="arrow">
                <i class="fa-solid fa-arrow-right"></i>
            </div>

        </div>

    `;

}


/* =========================================================
   BLOOD SEARCH
========================================================= */

function bloodSearchPage() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                BLOOD AVAILABILITY
            </div>

            <h1>
                Find Blood Near You
            </h1>

            <p>
                Search for available blood donors and blood
                banks based on blood group and location.
            </p>

        </div>


        <div class="card search-card">

            <div class="card-header">

                <div>

                    <h2>
                        Search Available Blood
                    </h2>

                    <p>
                        Enter your blood requirement details.
                    </p>

                </div>

                <div class="stat-icon red">
                    <i class="fa-solid fa-droplet"></i>
                </div>

            </div>


            <form
                id="bloodSearchForm"
                class="search-form"
            >

                <div class="form-group">

                    <label>Blood Group</label>

                    <select name="bloodGroup" required>

                        <option value="">
                            Select Blood Group
                        </option>

                        ${[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "AB+",
                            "AB-",
                            "O+",
                            "O-"
                        ].map(
                            x =>
                                `<option>${x}</option>`
                        ).join("")}

                    </select>

                </div>


                <div class="form-group">

                    <label>City</label>

                    <input
                        name="city"
                        placeholder="e.g. Mumbai"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>Units Required</label>

                    <select name="units">

                        ${[1,2,3,4,5].map(
                            x =>
                                `<option>${x} Unit${x > 1 ? "s" : ""}</option>`
                        ).join("")}

                    </select>

                </div>


                <div class="form-group">

                    <label>Urgency</label>

                    <select name="urgency">

                        <option>Normal</option>

                        <option>Urgent</option>

                        <option>Emergency</option>

                    </select>

                </div>


                <button
                    class="btn btn-primary search-button"
                    type="submit"
                >

                    <i class="fa-solid fa-magnifying-glass"></i>

                    Search Available Blood

                </button>

            </form>

        </div>


        <div
            id="bloodResults"
            class="search-results"
        ></div>

    `;

}


/* =========================================================
   MEDICINE SEARCH
========================================================= */

function medicineSearchPage() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                MEDICINE AVAILABILITY
            </div>

            <h1>
                Find Medicine Near You
            </h1>

            <p>
                Search for medicines and nearby medical stores.
            </p>

        </div>


        <div class="card search-card">

            <div class="card-header">

                <div>

                    <h2>
                        Search for a Medicine
                    </h2>

                    <p>
                        Enter medicine name and location.
                    </p>

                </div>

                <div class="stat-icon green">
                    <i class="fa-solid fa-pills"></i>
                </div>

            </div>


            <form
                id="medicineSearchForm"
                class="search-form"
            >

                <div class="form-group">

                    <label>Medicine Name</label>

                    <input
                        name="medicine"
                        placeholder="e.g. Paracetamol"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>City</label>

                    <input
                        name="city"
                        placeholder="e.g. Mumbai"
                        required
                    >

                </div>


                <div class="form-group full">

                    <label>Area / Locality</label>

                    <input
                        name="area"
                        placeholder="e.g. Andheri"
                    >

                </div>


                <button
                    class="btn btn-primary search-button"
                    type="submit"
                >

                    <i class="fa-solid fa-magnifying-glass"></i>

                    Search Medicine

                </button>

            </form>

        </div>


        <div
            id="medicineResults"
            class="search-results"
        ></div>

    `;

}


/* =========================================================
   OXYGEN SEARCH
========================================================= */

function oxygenSearchPage() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                OXYGEN AVAILABILITY
            </div>

            <h1>
                Find Oxygen Near You
            </h1>

            <p>
                Search for available oxygen cylinders and providers.
            </p>

        </div>


        <div class="card search-card">

            <form
                id="oxygenSearchForm"
                class="search-form"
            >

                <div class="form-group">

                    <label>Oxygen Type</label>

                    <select name="type">

                        <option>
                            Oxygen Cylinder
                        </option>

                        <option>
                            Oxygen Concentrator
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>City</label>

                    <input
                        name="city"
                        placeholder="e.g. Mumbai"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>Quantity Required</label>

                    <input
                        name="quantity"
                        type="number"
                        min="1"
                        value="1"
                    >

                </div>


                <button
                    class="btn btn-primary search-button"
                    type="submit"
                >

                    <i class="fa-solid fa-magnifying-glass"></i>

                    Search Oxygen

                </button>

            </form>

        </div>


        <div
            id="oxygenResults"
            class="search-results"
        ></div>

    `;

}


/* =========================================================
   DOCTOR SEARCH
========================================================= */

function doctorSearchPage() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                DOCTOR DIRECTORY
            </div>

            <h1>
                Find Doctors
            </h1>

            <p>
                Search doctors by specialization and location.
            </p>

        </div>


        <div class="card search-card">

            <form
                id="doctorSearchForm"
                class="search-form"
            >

                <div class="form-group">

                    <label>Specialization</label>

                    <select name="specialization">

                        <option value="">
                            Any Specialization
                        </option>

                        <option>Cardiologist</option>

                        <option>Dermatologist</option>

                        <option>Neurologist</option>

                        <option>Pediatrician</option>

                        <option>General Physician</option>

                        <option>Orthopedic</option>

                        <option>Gynecologist</option>

                    </select>

                </div>


                <div class="form-group">

                    <label>City</label>

                    <input
                        name="city"
                        placeholder="e.g. Mumbai"
                    >

                </div>


                <button
                    class="btn btn-primary search-button"
                    type="submit"
                >

                    <i class="fa-solid fa-user-doctor"></i>

                    Find Doctors

                </button>

            </form>

        </div>


        <div
            id="doctorResults"
            class="search-results"
        ></div>

    `;

}


/* =========================================================
   HOSPITAL SEARCH
========================================================= */

function hospitalSearchPage() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                HOSPITAL DIRECTORY
            </div>

            <h1>
                Find Hospitals
            </h1>

            <p>
                Find hospitals and healthcare facilities near you.
            </p>

        </div>


        <div class="card search-card">

            <form
                id="hospitalSearchForm"
                class="search-form"
            >

                <div class="form-group">

                    <label>Hospital / Facility</label>

                    <input
                        name="name"
                        placeholder="Hospital name"
                    >

                </div>


                <div class="form-group">

                    <label>City</label>

                    <input
                        name="city"
                        placeholder="e.g. Mumbai"
                    >

                </div>


                <button
                    class="btn btn-primary search-button"
                    type="submit"
                >

                    <i class="fa-solid fa-hospital"></i>

                    Find Hospitals

                </button>

            </form>

        </div>


        <div
            id="hospitalResults"
            class="search-results"
        ></div>

    `;

}


/* =========================================================
   EMERGENCY
========================================================= */

function emergencyPage() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                EMERGENCY SUPPORT
            </div>

            <h1>
                Emergency
            </h1>

            <p>
                Quick access to emergency services.
            </p>

        </div>


        <div class="emergency-banner">

            <h2>
                <i class="fa-solid fa-truck-medical"></i>
                Emergency Medical Assistance
            </h2>

            <p>
                If this is a life-threatening emergency,
                contact emergency services immediately.
            </p>

            <div class="emergency-number">
                112
            </div>

            <a
                href="tel:112"
                class="btn btn-danger"
            >

                <i class="fa-solid fa-phone"></i>

                Call Emergency Services

            </a>

        </div>


        <div class="grid grid-3">

            ${serviceCard(
                "hospitals",
                "fa-hospital",
                "Nearby Hospitals",
                "Find hospitals for emergency treatment.",
                "blue"
            )}

            ${serviceCard(
                "blood",
                "fa-droplet",
                "Emergency Blood",
                "Search for blood availability.",
                "red"
            )}

            ${serviceCard(
                "oxygen",
                "fa-lungs",
                "Emergency Oxygen",
                "Find available oxygen providers.",
                "blue"
            )}

        </div>

    `;

}

/* =========================================================
   DONOR REGISTRATION
========================================================= */

function donorRegistrationPage() {

    const user = state.user || {};

    return `

        <div class="page-heading">

            <div class="eyebrow">
                BLOOD DONATION
            </div>

            <h1>
                Become a Blood Donor
            </h1>

            <p>
                Register as a blood donor and help people
                who need compatible blood in your area.
            </p>

        </div>


        <div class="grid grid-2">


            <!-- =========================================
                 REGISTRATION FORM
            ========================================== -->

            <div class="card">

                <div class="section-title">

                    <div class="eyebrow">
                        DONOR REGISTRATION
                    </div>

                    <h2>
                        Your Donor Information
                    </h2>

                </div>


                <form id="donorRegistrationForm">


                    <!-- FULL NAME -->

                    <div class="field">

                        <label>
                            Full Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value="${esc(user.name || "")}"
                            placeholder="Enter your full name"
                            required
                        >

                    </div>


                    <!-- PHONE -->

                    <div class="field">

                        <label>
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            name="phone"
                            value="${esc(user.phone || "")}"
                            placeholder="Enter your contact number"
                            required
                        >

                    </div>


                    <!-- AGE + BLOOD GROUP -->

                    <div class="form-grid-2">


                        <div class="field">

                            <label>
                                Age
                            </label>

                            <input
                                type="number"
                                name="age"
                                min="18"
                                max="65"
                                placeholder="Enter your age"
                                required
                            >

                        </div>


                        <div class="field">

                            <label>
                                Blood Group
                            </label>

                            <select
                                name="blood_group"
                                required
                            >

                                <option value="">
                                    Select blood group
                                </option>

                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>

                            </select>

                        </div>

                    </div>


                    <!-- GENDER -->

                    <div class="field">

                        <label>
                            Gender
                        </label>

                        <select
                            name="gender"
                            required
                        >

                            <option value="">
                                Select gender
                            </option>

                            <option value="Male">
                                Male
                            </option>

                            <option value="Female">
                                Female
                            </option>

                            <option value="Other">
                                Other
                            </option>

                            <option value="Prefer not to say">
                                Prefer not to say
                            </option>

                        </select>

                    </div>


                    <!-- CITY -->

                    <div class="field">

                        <label>
                            City
                        </label>

                        <input
                            type="text"
                            name="city"
                            value="${esc(user.city || "")}"
                            placeholder="Enter your city"
                            required
                        >

                    </div>


                    <!-- ADDRESS -->

                    <div class="field">

                        <label>
                            Address
                        </label>

                        <textarea
                            name="address"
                            rows="3"
                            placeholder="Enter your complete address"
                            required
                        ></textarea>

                    </div>


                    <!-- AVAILABILITY -->

                    <div class="field">

                        <label>
                            Donation Availability
                        </label>

                        <select
                            name="availability"
                            required
                        >

                            <option value="">
                                Select availability
                            </option>

                            <option value="available">
                                Available to Donate
                            </option>

                            <option value="unavailable">
                                Currently Unavailable
                            </option>

                        </select>

                    </div>


                    <!-- CONSENT -->

                    <label class="consent-row">

                        <input
                            type="checkbox"
                            name="consent"
                            required
                        >

                        <span>
                            I agree to share my donor information
                            with users searching for compatible blood.
                        </span>

                    </label>


                    <!-- REGISTER BUTTON -->

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >

                        <i class="fa-solid fa-hand-holding-droplet"></i>

                        Register as Blood Donor

                    </button>


                </form>

            </div>


            <!-- =========================================
                 INFORMATION SIDE
            ========================================== -->

            <div>


                <div class="card">

                    <div class="stat-icon red">

                        <i class="fa-solid fa-heart"></i>

                    </div>

                    <h2>
                        Help Someone in Need
                    </h2>

                    <p>
                        Your donor profile can help people
                        searching for compatible blood in
                        your area.
                    </p>

                </div>


                <div class="card">

                    <div class="eyebrow">
                        HOW IT WORKS
                    </div>

                    <h2>
                        Donor Process
                    </h2>


                    <div class="step">

                        <div class="step-number">
                            1
                        </div>

                        <div>

                            <strong>
                                Register as Donor
                            </strong>

                            <p>
                                Add your blood and location details.
                            </p>

                        </div>

                    </div>


                    <div class="step">

                        <div class="step-number">
                            2
                        </div>

                        <div>

                            <strong>
                                Set Availability
                            </strong>

                            <p>
                                Choose whether you are available.
                            </p>

                        </div>

                    </div>


                    <div class="step">

                        <div class="step-number">
                            3
                        </div>

                        <div>

                            <strong>
                                Get Matched
                            </strong>

                            <p>
                                Compatible blood requests can find you.
                            </p>

                        </div>

                    </div>


                    <div class="step">

                        <div class="step-number">
                            4
                        </div>

                        <div>

                            <strong>
                                Help Someone
                            </strong>

                            <p>
                                Respond to people who need blood.
                            </p>

                        </div>

                    </div>


                </div>


            </div>

        </div>

    `;

}

/* =========================================================
   DONOR PAGES
========================================================= */

function renderDonorPage(page) {

    switch (page) {

        case "dashboard":
            return donorDashboard();

        case "requests":
            return donorRequests();

        case "history":
            return donationHistory();

        case "availability":
            return donorAvailability();

        case "profile":
            return profilePage("donor");

        case "certificate":
            return certificatePage();

        case "notifications":
            return notificationsPage();

        case "settings":
            return settingsPage();

        default:
            return donorDashboard();

    }

}


/* =========================================================
   DONOR DASHBOARD
========================================================= */

function donorDashboard() {

    const donor =
        state.donor;


    const total =
        state.donations.length;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                DONOR DASHBOARD
            </div>

            <h1>
                Welcome, ${esc(donor.name)}
            </h1>

            <p>
                Thank you for being a part of the
                HealthConnect donor community.
            </p>

        </div>


        <div class="grid grid-4">

            ${statCard(
                "fa-droplet",
                "red",
                "Total Donations",
                total,
                "Recorded donations"
            )}

            ${statCard(
                "fa-circle-check",
                "green",
                "Availability",
                donor.available
                    ? "Available"
                    : "Unavailable",
                "Current donor status"
            )}

            ${statCard(
                "fa-calendar-check",
                "blue",
                "Next Eligible",
                "Available",
                "Based on donation records"
            )}

            ${statCard(
                "fa-droplet",
                "purple",
                "Blood Group",
                donor.bloodGroup || "Not Added",
                "Donor blood group"
            )}

        </div>


        <div class="section">

            <div class="section-title">

                <div class="eyebrow">
                    DONOR SERVICES
                </div>

                <h2>
                    Manage Your Donation
                </h2>

            </div>


            <div class="grid grid-2">

                ${serviceCard(
                    "requests",
                    "fa-droplet",
                    "Blood Requests",
                    "View compatible blood requests and respond to people in need.",
                    "red"
                )}

                ${serviceCard(
                    "availability",
                    "fa-circle-check",
                    "Availability",
                    "Choose whether you are currently available to donate blood.",
                    "green"
                )}

                ${serviceCard(
                    "history",
                    "fa-clock-rotate-left",
                    "Donation History",
                    "View your previous blood donation records.",
                    "blue"
                )}

                ${serviceCard(
                    "profile",
                    "fa-user",
                    "Donor Profile",
                    "Manage your personal and donor information.",
                    "purple"
                )}

            </div>

        </div>

    `;

}


/* =========================================================
   STAT CARD
========================================================= */

function statCard(
    icon,
    color,
    label,
    value,
    note
) {

    return `

        <div class="card stat-card">

            <div class="stat-icon ${color}">

                <i class="fa-solid ${icon}"></i>

            </div>

            <div class="stat-label">
                ${label}
            </div>

            <div class="stat-value">
                ${esc(value)}
            </div>

            <div class="stat-note">
                ${note}
            </div>

        </div>

    `;

}


/* =========================================================
   DONOR REQUESTS
========================================================= */

function donorRequests() {

    const requests =
        state.bloodRequests;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                BLOOD REQUESTS
            </div>

            <h1>
                Blood Requests
            </h1>

            <p>
                Requests matching your donor information
                will appear here.
            </p>

        </div>


        ${
            requests.length
                ? requests.map(
                    donorRequestCard
                ).join("")
                : `
                    <div class="empty">

                        <i class="fa-solid fa-droplet"></i>

                        <h3>
                            No blood requests
                        </h3>

                        <p>
                            No blood requests are currently available.
                        </p>

                    </div>
                `
        }

    `;

}



function donorRequestCard(request) {
    const bloodGroup = request.bloodGroup || request.blood_group || "";
    const units = request.units ?? 1;
    const city = request.city || "";
    const urgency = request.urgency || "Normal";
    const status = request.status || "Pending";
    const requestDate = request.date || (
        request.created_at
            ? new Date(request.created_at).toLocaleString()
            : "Recently"
    );

    return `
        <div class="result-card">
            <div class="result-main">
                <div class="result-icon">
                    <i class="fa-solid fa-droplet"></i>
                </div>

                <div>
                    <h3>${esc(bloodGroup)} · ${esc(units)} unit(s)</h3>
                    <p>${esc(city)} · ${esc(urgency)}</p>
                    <p>Requested ${esc(requestDate)}</p>

                    ${request.requester_name
                        ? `<p>Requested by: ${esc(request.requester_name)}</p>`
                        : ""}

                    ${request.requester_email
                        ? `<p>${esc(request.requester_email)}</p>`
                        : ""}
                </div>
            </div>

            <div class="result-actions">
                <span class="badge ${
                    urgency === "Emergency" ? "red" :
                    urgency === "Urgent" ? "yellow" : "blue"
                }">${esc(urgency)}</span>

                <span class="badge ${
                    status === "Confirmed" ? "green" :
                    status === "Pending" ? "yellow" : "blue"
                }">${esc(status)}</span>

                ${status === "Pending" ? `
                    <button
                        class="btn btn-primary btn-small"
                        type="button"
                        data-confirm-blood-request="${esc(request.id)}">
                        <i class="fa-solid fa-check"></i>
                        Confirm Request
                    </button>
                ` : ""}
            </div>
        </div>
    `;
}



/* =========================================================
   DONATION HISTORY
========================================================= */

function donationHistory() {

    const donations =
        state.donations;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                DONATION HISTORY
            </div>

            <h1>
                Donation History
            </h1>

            <p>
                Your recorded blood donation activity.
            </p>

        </div>


        <div class="card">

            ${
                donations.length
                    ? `
                        <div class="table-wrap">

                            <table class="data-table">

                                <thead>

                                    <tr>

                                        <th>Date</th>

                                        <th>Blood Group</th>

                                        <th>Units</th>

                                        <th>Location</th>

                                        <th>Status</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${donations.map(
                                        d => `

                                            <tr>

                                                <td>
                                                    ${esc(d.date)}
                                                </td>

                                                <td>
                                                    ${esc(d.bloodGroup)}
                                                </td>

                                                <td>
                                                    ${esc(d.units)}
                                                </td>

                                                <td>
                                                    ${esc(d.location)}
                                                </td>

                                                <td>
                                                    <span class="badge green">
                                                        ${esc(d.status)}
                                                    </span>
                                                </td>

                                            </tr>

                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>
                    `
                    : `
                        <div class="empty">

                            <i class="fa-solid fa-clock-rotate-left"></i>

                            <h3>
                                No donation records
                            </h3>

                            <p>
                                Completed donations will appear here.
                            </p>

                        </div>
                    `
            }

        </div>

    `;

}

/* =========================================================
   DONOR AVAILABILITY
========================================================= */

function donorAvailability() {

    const available =
        state.donor.available;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                DONOR AVAILABILITY
            </div>

            <h1>
                Availability
            </h1>

            <p>
                Control whether you are currently available
                to receive blood donation requests.
            </p>

        </div>


        <div class="card">

            <div class="toggle-row">

                <div class="toggle-text">

                    <strong>
                        Available for Blood Donation
                    </strong>

                    <span>
                        ${
                            available
                                ? "You can currently receive compatible requests."
                                : "You are currently unavailable for requests."
                        }
                    </span>

                </div>


                <label class="toggle">

                    <input
                        type="checkbox"
                        id="donorAvailable"
                        ${
                            available
                                ? "checked"
                                : ""
                        }
                    >

                    <span class="slider"></span>

                </label>

            </div>

        </div>

    `;

}


/* =========================================================
   CERTIFICATE
========================================================= */

function certificatePage() {

    const donor =
        state.donor;


    if (!state.donations.length) {

        return `

            <div class="page-heading">

                <div class="eyebrow">
                    DONATION CERTIFICATE
                </div>

                <h1>
                    Donation Certificate
                </h1>

                <p>
                    Certificates are available after a completed donation.
                </p>

            </div>


            <div class="empty">

                <i class="fa-solid fa-certificate"></i>

                <h3>
                    No completed donation yet
                </h3>

                <p>
                    Your certificate will appear here after
                    a completed donation is recorded.
                </p>

            </div>

        `;

    }


    return `

        <div class="page-heading">

            <div class="eyebrow">
                DONATION CERTIFICATE
            </div>

            <h1>
                Certificate
            </h1>

        </div>


        <div class="certificate">

            <div class="certificate-logo">

                <i class="fa-solid fa-heart-pulse"></i>

            </div>

            <div class="eyebrow">
                HEALTHCONNECT
            </div>

            <h1>
                Certificate of Appreciation
            </h1>

            <p>
                This certificate is proudly presented to
            </p>

            <div class="name">
                ${esc(donor.name)}
            </div>

            <p>
                in recognition of their valuable contribution
                through voluntary blood donation.
            </p>

            <p>
                Thank you for helping save lives.
            </p>


            <div class="certificate-sign">

                <div>
                    HealthConnect<br>
                    Healthcare Platform
                </div>

                <div>
                    Date<br>
                    ${today()}
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   PHARMACY PAGES
========================================================= */

function renderPharmacyPage(page) {

    switch (page) {

        case "dashboard":
            return pharmacyDashboard();

        case "profile":
            return profilePage("pharmacy");

        case "inventory":
            return pharmacyInventory();

        case "requests":
            return pharmacyRequests();

        case "availability":
            return pharmacyAvailability();

        case "orders":
            return pharmacyOrders();

        case "notifications":
            return notificationsPage();

        case "settings":
            return settingsPage();

        default:
            return pharmacyDashboard();

    }

}


/* =========================================================
   PHARMACY DASHBOARD
========================================================= */

function pharmacyDashboard() {

    const inventory =
        state.medicineRecords;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                PHARMACY / MEDICAL STORE
            </div>

            <h1>
                Medical Store Dashboard
            </h1>

            <p>
                Manage medicines, requests and store availability.
            </p>

        </div>


        <div class="grid grid-4">

            ${statCard(
                "fa-pills",
                "green",
                "Medicines",
                inventory.length,
                "Inventory records"
            )}

            ${statCard(
                "fa-box",
                "blue",
                "Available",
                inventory.filter(
                    x => Number(x.quantity) > 0
                ).length,
                "Medicines in stock"
            )}

            ${statCard(
                "fa-file-medical",
                "purple",
                "Requests",
                state.medicineRequests.length,
                "Medicine requests"
            )}

            ${statCard(
                "fa-circle-check",
                "green",
                "Store Status",
                "Available",
                "Current availability"
            )}

        </div>


        <div class="section">

            <div class="grid grid-2">

                ${serviceCard(
                    "inventory",
                    "fa-pills",
                    "Medicine Inventory",
                    "Add, edit and remove medicines available in your store.",
                    "green"
                )}

                ${serviceCard(
                    "requests",
                    "fa-file-medical",
                    "Medicine Requests",
                    "View medicine requests submitted by users.",
                    "blue"
                )}

            </div>

        </div>

    `;

}


/* =========================================================
   PHARMACY INVENTORY
========================================================= */

function pharmacyInventory() {

    const records =
        state.medicineRecords;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                MEDICINE MANAGEMENT
            </div>

            <h1>
                Medicine Inventory
            </h1>

            <p>
                Manage medicines available in your store.
            </p>

        </div>


        <div class="card">

            <div class="card-header">

                <div>

                    <h2>
                        Medicine Inventory
                    </h2>

                    <p>
                        ${records.length}
                        medicine record(s)
                    </p>

                </div>


                <button
                    class="btn btn-primary btn-small"
                    data-add-medicine
                    type="button"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add Medicine

                </button>

            </div>


            ${
                records.length
                    ? `
                        <div class="table-wrap">

                            <table class="data-table">

                                <thead>

                                    <tr>

                                        <th>Medicine</th>

                                        <th>Adreess/Contact No.</th>

                                        <th>Quantity</th>

                                        <th>Price</th>

                                        <th>Status</th>

                                        <th>Actions</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${records.map(
                                        medicineRow
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>
                    `
                    : emptyInventory(
                        "No medicines added yet",
                        "Use Add Medicine to create your first inventory record."
                    )
            }

        </div>

    `;

}


function emptyInventory(title, text) {

    return `

        <div class="empty">

            <i class="fa-solid fa-box-open"></i>

            <h3>
                ${title}
            </h3>

            <p>
                ${text}
            </p>

        </div>

    `;

}


function medicineRow(item) {

    const available =
        Number(item.quantity) > 0;


    return `

        <tr>

            <td>
                <strong>
                    ${esc(item.name)}
                </strong>
            </td>

            <td>
                ${esc(item.category)}
            </td>

            <td>
                ${esc(item.quantity)}
            </td>

            <td>
                ₹${esc(item.price)}
            </td>

            <td>

                <span class="badge ${
                    available
                        ? "green"
                        : "red"
                }">

                    ${
                        available
                            ? "Available"
                            : "Out of Stock"
                    }

                </span>

            </td>

            <td>

                <button
                    class="btn btn-secondary btn-small"
                    data-edit-medicine="${item.id}"
                    type="button"
                >
                    Edit
                </button>

                <button
                    class="btn btn-danger btn-small"
                    data-delete-medicine="${item.id}"
                    type="button"
                >
                    Delete
                </button>

            </td>

        </tr>

    `;

}


/* =========================================================
   PHARMACY REQUESTS
========================================================= */

function pharmacyRequests() {

    const requests =
        state.medicineRequests;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                MEDICINE REQUESTS
            </div>

            <h1>
                Medicine Requests
            </h1>

            <p>
                Requests submitted by users.
            </p>

        </div>


        ${
            requests.length
                ? requests.map(
                    request => `

                        <div class="result-card">

                            <div class="result-main">

                                <div class="result-icon">

                                    <i class="fa-solid fa-pills"></i>

                                </div>

                                <div>

                                    <h3>
                                        ${esc(request.medicine)}
                                    </h3>

                                    <p>
                                        ${esc(request.city)}
                                        · Qty ${esc(request.quantity)}
                                    </p>

                                </div>

                            </div>

                            <span class="badge yellow">
                                ${esc(request.status || "Pending")}
                            </span>

                        </div>

                    `
                ).join("")
                : `
                    <div class="empty">

                        <i class="fa-solid fa-file-medical"></i>

                        <h3>
                            No medicine requests
                        </h3>

                        <p>
                            New requests will appear here.
                        </p>

                    </div>
                `
        }

    `;

}


/* =========================================================
   PHARMACY AVAILABILITY
========================================================= */

function pharmacyAvailability() {

    return availabilityPage(
        "pharmacy",
        "Store Availability",
        "Allow users to find your medical store when medicines are available."
    );

}


function availabilityPage(
    role,
    title,
    description
) {

    let available = true;


    if (role === "donor") {
        available = state.donor.available;
    }


    return `

        <div class="page-heading">

            <div class="eyebrow">
                AVAILABILITY
            </div>

            <h1>
                ${title}
            </h1>

            <p>
                ${description}
            </p>

        </div>


        <div class="card">

            <div class="toggle-row">

                <div class="toggle-text">

                    <strong>
                        Currently Available
                    </strong>

                    <span>
                        ${
                            available
                                ? "Your account is marked available."
                                : "Your account is marked unavailable."
                        }
                    </span>

                </div>


                <label class="toggle">

                    <input
                        type="checkbox"
                        id="providerAvailability"
                        ${
                            available
                                ? "checked"
                                : ""
                        }
                    >

                    <span class="slider"></span>

                </label>

            </div>

        </div>

    `;

}


/* =========================================================
   PHARMACY ORDERS
========================================================= */

function pharmacyOrders() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                ORDERS
            </div>

            <h1>
                Orders
            </h1>

            <p>
                Medicine orders will appear here.
            </p>

        </div>


        <div class="empty">

            <i class="fa-solid fa-cart-shopping"></i>

            <h3>
                No orders yet
            </h3>

            <p>
                Orders will be displayed here when users place them.
            </p>

        </div>

    `;

}


/* =========================================================
   OXYGEN PROVIDER
========================================================= */

function renderOxygenPage(page) {

    switch (page) {

        case "dashboard":
            return oxygenDashboard();

        case "profile":
            return profilePage("oxygen");

        case "inventory":
            return oxygenInventory();

        case "requests":
            return oxygenRequests();

        case "availability":
            return availabilityPage(
                "oxygen",
                "Provider Availability",
                "Manage whether your oxygen service is available."
            );

        case "orders":
            return oxygenOrders();

        case "notifications":
            return notificationsPage();

        case "settings":
            return settingsPage();

        default:
            return oxygenDashboard();

    }

}


function oxygenDashboard() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                OXYGEN PROVIDER
            </div>

            <h1>
                Oxygen Provider Dashboard
            </h1>

            <p>
                Manage oxygen cylinders, concentrators and requests.
            </p>

        </div>


        <div class="grid grid-4">

            ${statCard(
                "fa-lungs",
                "blue",
                "Inventory",
                state.oxygenRecords.length,
                "Oxygen records"
            )}

            ${statCard(
                "fa-box",
                "green",
                "Available",
                state.oxygenRecords.filter(
                    x => Number(x.quantity) > 0
                ).length,
                "Available records"
            )}

            ${statCard(
                "fa-file-medical",
                "purple",
                "Requests",
                state.oxygenRequests.length,
                "Oxygen requests"
            )}

            ${statCard(
                "fa-circle-check",
                "green",
                "Status",
                "Available",
                "Provider status"
            )}

        </div>


        <div class="section">

            <div class="grid grid-2">

                ${serviceCard(
                    "inventory",
                    "fa-lungs",
                    "Oxygen Inventory",
                    "Add and manage oxygen cylinders and concentrators.",
                    "blue"
                )}

                ${serviceCard(
                    "requests",
                    "fa-file-medical",
                    "Oxygen Requests",
                    "View requests from users and healthcare facilities.",
                    "purple"
                )}

            </div>

        </div>

    `;

}


/* =========================================================
   OXYGEN INVENTORY
========================================================= */

function oxygenInventory() {

    const records =
        state.oxygenRecords;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                OXYGEN MANAGEMENT
            </div>

            <h1>
                Oxygen Inventory
            </h1>

            <p>
                Manage cylinders and oxygen concentrators.
            </p>

        </div>


        <div class="card">

            <div class="card-header">

                <div>

                    <h2>
                        Oxygen Inventory
                    </h2>

                    <p>
                        Add oxygen products available from your provider.
                    </p>

                </div>


                <button
                    class="btn btn-primary btn-small"
                    data-add-oxygen
                    type="button"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add Oxygen

                </button>

            </div>


            ${
                records.length
                    ? `
                        <div class="table-wrap">

                            <table class="data-table">

                                <thead>

                                    <tr>

                                        <th>Type</th>

                                        <th>Contact Number</th>

                                        <th>Quantity</th>

                                        <th>Price</th>

                                        <th>Status</th>

                                        <th>Actions</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${records.map(
                                        oxygenRow
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>
                    `
                    : emptyInventory(
                        "No oxygen records",
                        "Add your first oxygen product."
                    )
            }

        </div>

    `;

}


function oxygenRow(item) {

    const available =
        Number(item.quantity) > 0;


    return `

        <tr>

            <td>
                ${esc(item.type)}
            </td>

            <td>
                ${esc(item.capacity || "-")}
            </td>

            <td>
                ${esc(item.quantity)}
            </td>

            <td>
                ₹${esc(item.price)}
            </td>

            <td>

                <span class="badge ${
                    available
                        ? "green"
                        : "red"
                }">

                    ${
                        available
                            ? "Available"
                            : "Out of Stock"
                    }

                </span>

            </td>

            <td>

                <button
                    class="btn btn-secondary btn-small"
                    data-edit-oxygen="${item.id}"
                    type="button"
                >
                    Edit
                </button>

                <button
                    class="btn btn-danger btn-small"
                    data-delete-oxygen="${item.id}"
                    type="button"
                >
                    Delete
                </button>

            </td>

        </tr>

    `;

}


function oxygenRequests() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                OXYGEN REQUESTS
            </div>

            <h1>
                Oxygen Requests
            </h1>

            <p>
                Manage oxygen requests submitted by users.
            </p>

        </div>


        ${
            state.oxygenRequests.length
                ? state.oxygenRequests.map(
                    request => `

                        <div class="result-card">

                            <div class="result-main">

                                <div class="result-icon">

                                    <i class="fa-solid fa-lungs"></i>

                                </div>

                                <div>

                                    <h3>
                                        ${esc(request.type)}
                                    </h3>

                                    <p>
                                        ${esc(request.city)}
                                        · Qty ${esc(request.quantity)}
                                    </p>

                                </div>

                            </div>

                            <span class="badge yellow">
                                ${esc(request.status || "Pending")}
                            </span>

                        </div>

                    `
                ).join("")
                : `
                    <div class="empty">

                        <i class="fa-solid fa-file-medical"></i>

                        <h3>
                            No oxygen requests
                        </h3>

                        <p>
                            New requests will appear here.
                        </p>

                    </div>
                `
        }

    `;

}


function oxygenOrders() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                ORDERS
            </div>

            <h1>
                Oxygen Orders
            </h1>

            <p>
                Manage oxygen orders and deliveries.
            </p>

        </div>


        <div class="empty">

            <i class="fa-solid fa-cart-shopping"></i>

            <h3>
                No orders yet
            </h3>

            <p>
                New oxygen orders will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   DOCTOR
========================================================= */

function renderDoctorPage(page) {

    switch (page) {

        case "dashboard":
            return doctorDashboard();

        case "profile":
            return profilePage("doctor");

        case "appointments":
            return doctorAppointments();

        case "patients":
            return doctorPatients();

        case "availability":
            return doctorAvailability();

        case "requests":
            return doctorRequests();

        case "notifications":
            return notificationsPage();

        case "settings":
            return settingsPage();

        default:
            return doctorDashboard();

    }

}


function doctorDashboard() {

    const doctor =
        state.doctor;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                DOCTOR ACCOUNT
            </div>

            <h1>
                Doctor Dashboard
            </h1>

            <p>
                Manage appointments, patients and consultation requests.
            </p>

        </div>


        <div class="grid grid-4">

            ${statCard(
                "fa-calendar-check",
                "blue",
                "Appointments",
                state.appointments.length,
                "Scheduled appointments"
            )}

            ${statCard(
                "fa-users",
                "purple",
                "Patients",
                state.appointments.length,
                "Patient records"
            )}

            ${statCard(
                "fa-file-medical",
                "green",
                "Requests",
                "0",
                "Consultation requests"
            )}

            ${statCard(
                "fa-circle-check",
                "green",
                "Availability",
                doctor.available
                    ? "Available"
                    : "Unavailable",
                "Current status"
            )}

        </div>


        <div class="section">

            <div class="grid grid-2">

                ${serviceCard(
                    "appointments",
                    "fa-calendar-check",
                    "Appointments",
                    "View and manage patient appointments.",
                    "blue"
                )}

                ${serviceCard(
                    "profile",
                    "fa-user-doctor",
                    "Doctor Profile",
                    "Manage specialization and professional information.",
                    "purple"
                )}

            </div>

        </div>

    `;

}


function doctorAppointments() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                APPOINTMENTS
            </div>

            <h1>
                Appointments
            </h1>

            <p>
                View your scheduled consultations.
            </p>

        </div>


        ${
            state.appointments.length
                ? `
                    <div class="card">

                        <div class="table-wrap">

                            <table class="data-table">

                                <thead>

                                    <tr>

                                        <th>Patient</th>

                                        <th>Date</th>

                                        <th>Time</th>

                                        <th>Status</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${state.appointments.map(
                                        appointment => `

                                            <tr>

                                                <td>
                                                    ${esc(appointment.patient)}
                                                </td>

                                                <td>
                                                    ${esc(appointment.date)}
                                                </td>

                                                <td>
                                                    ${esc(appointment.time)}
                                                </td>

                                                <td>
                                                    <span class="badge blue">
                                                        ${esc(appointment.status || "Pending")}
                                                    </span>
                                                </td>

                                            </tr>

                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>

                    </div>
                `
                : `
                    <div class="empty">

                        <i class="fa-solid fa-calendar-check"></i>

                        <h3>
                            No appointments
                        </h3>

                        <p>
                            Patient appointments will appear here.
                        </p>

                    </div>
                `
        }

    `;

}


function doctorPatients() {

    const patients =
        state.appointments;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                PATIENTS
            </div>

            <h1>
                Patients
            </h1>

            <p>
                Patients associated with your appointments.
            </p>

        </div>


        ${
            patients.length
                ? patients.map(
                    p => `

                        <div class="result-card">

                            <div class="result-main">

                                <div class="result-icon">

                                    <i class="fa-solid fa-user"></i>

                                </div>

                                <div>

                                    <h3>
                                        ${esc(p.patient)}
                                    </h3>

                                    <p>
                                        Appointment:
                                        ${esc(p.date)}
                                        at
                                        ${esc(p.time)}
                                    </p>

                                </div>

                            </div>

                        </div>

                    `
                ).join("")
                : `
                    <div class="empty">

                        <i class="fa-solid fa-users"></i>

                        <h3>
                            No patient records
                        </h3>

                        <p>
                            Patients will appear after appointments are created.
                        </p>

                    </div>
                `
        }

    `;

}


function doctorAvailability() {

    return availabilityPage(
        "doctor",
        "Doctor Availability",
        "Choose whether patients can request consultations."
    );

}


function doctorRequests() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                CONSULTATION REQUESTS
            </div>

            <h1>
                Consultation Requests
            </h1>

            <p>
                Patient consultation requests will appear here.
            </p>

        </div>


        <div class="empty">

            <i class="fa-solid fa-file-medical"></i>

            <h3>
                No consultation requests
            </h3>

            <p>
                New requests will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   HOSPITAL
========================================================= */

function renderHospitalPage(page) {

    switch (page) {

        case "dashboard":
            return hospitalDashboard();

        case "profile":
            return profilePage("hospital");

        case "blood":
            return hospitalBloodStock();

        case "oxygen":
            return hospitalOxygenStock();

        case "beds":
            return hospitalBeds();

        case "doctors":
            return hospitalDoctors();

        case "requests":
            return hospitalRequests();

        case "notifications":
            return notificationsPage();

        case "settings":
            return settingsPage();

        default:
            return hospitalDashboard();

    }

}


function hospitalDashboard() {

    const hospital =
        state.hospital;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                HOSPITAL ACCOUNT
            </div>

            <h1>
                Hospital Dashboard
            </h1>

            <p>
                Manage hospital resources and healthcare availability.
            </p>

        </div>


        <div class="grid grid-4">

            ${statCard(
                "fa-bed",
                "blue",
                "Available Beds",
                hospital.availableBeds || 0,
                "Current bed availability"
            )}

            ${statCard(
                "fa-droplet",
                "red",
                "Blood Stock",
                "Manage",
                "Blood inventory"
            )}

            ${statCard(
                "fa-lungs",
                "blue",
                "Oxygen Stock",
                "Manage",
                "Oxygen inventory"
            )}

            ${statCard(
                "fa-user-doctor",
                "purple",
                "Doctors",
                state.doctors.length,
                "Registered doctors"
            )}

        </div>


        <div class="section">

            <div class="grid grid-2">

                ${serviceCard(
                    "beds",
                    "fa-bed",
                    "Bed Availability",
                    "Manage available hospital beds.",
                    "blue"
                )}

                ${serviceCard(
                    "doctors",
                    "fa-user-doctor",
                    "Doctor Management",
                    "Manage doctors associated with your hospital.",
                    "purple"
                )}

            </div>

        </div>

    `;

}


function hospitalBloodStock() {

    return stockPage(
        "Blood Stock",
        "fa-droplet",
        "Blood units available in your hospital."
    );

}


function hospitalOxygenStock() {

    return stockPage(
        "Oxygen Stock",
        "fa-lungs",
        "Oxygen resources available in your hospital."
    );

}


function stockPage(
    title,
    icon,
    description
) {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                HOSPITAL RESOURCES
            </div>

            <h1>
                ${title}
            </h1>

            <p>
                ${description}
            </p>

        </div>


        <div class="card">

            <div class="card-header">

                <div>

                    <h2>
                        ${title}
                    </h2>

                    <p>
                        Resource management interface.
                    </p>

                </div>

                <button
                    class="btn btn-primary btn-small"
                    data-stock-add
                    type="button"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add Record

                </button>

            </div>


            <div class="empty">

                <i class="fa-solid ${icon}"></i>

                <h3>
                    No stock records
                </h3>

                <p>
                    Add a stock record to manage hospital resources.
                </p>

            </div>

        </div>

    `;

}


function hospitalBeds() {

    const hospital =
        state.hospital;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                BED AVAILABILITY
            </div>

            <h1>
                Bed Availability
            </h1>

            <p>
                Manage hospital bed availability.
            </p>

        </div>


        <div class="card">

            <form
                id="bedsForm"
                class="form-grid"
            >

                <div class="form-group">

                    <label>
                        Total Beds
                    </label>

                    <input
                        name="beds"
                        type="number"
                        min="0"
                        value="${esc(hospital.beds || 0)}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label>
                        Available Beds
                    </label>

                    <input
                        name="availableBeds"
                        type="number"
                        min="0"
                        value="${esc(hospital.availableBeds || 0)}"
                        required
                    >

                </div>


                <div class="form-actions full">

                    <button
                        class="btn btn-primary"
                        type="submit"
                    >

                        <i class="fa-solid fa-floppy-disk"></i>

                        Save Bed Availability

                    </button>

                </div>

            </form>

        </div>

    `;

}


function hospitalDoctors() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                DOCTOR MANAGEMENT
            </div>

            <h1>
                Doctor Management
            </h1>

            <p>
                Doctors associated with your hospital.
            </p>

        </div>


        <div class="card">

            <div class="card-header">

                <h2>
                    Doctors
                </h2>

                <button
                    class="btn btn-primary btn-small"
                    data-add-doctor
                    type="button"
                >

                    <i class="fa-solid fa-plus"></i>

                    Add Doctor

                </button>

            </div>


            ${
                state.doctors.length
                    ? state.doctors.map(
                        d => `

                            <div class="result-card">

                                <div class="result-main">

                                    <div class="result-icon">

                                        <i class="fa-solid fa-user-doctor"></i>

                                    </div>

                                    <div>

                                        <h3>
                                            ${esc(d.name)}
                                        </h3>

                                        <p>
                                            ${esc(d.specialization)}
                                            ·
                                            ${esc(d.phone)}
                                        </p>

                                    </div>

                                </div>


                                <button
                                    class="btn btn-danger btn-small"
                                    data-delete-doctor="${d.id}"
                                    type="button"
                                >

                                    Delete

                                </button>

                            </div>

                        `
                    ).join("")
                    : `
                        <div class="empty">

                            <i class="fa-solid fa-user-doctor"></i>

                            <h3>
                                No doctors added
                            </h3>

                            <p>
                                Add doctors associated with your hospital.
                            </p>

                        </div>
                    `
            }

        </div>

    `;

}


function hospitalRequests() {

    return `

        <div class="page-heading">

            <div class="eyebrow">
                HOSPITAL REQUESTS
            </div>

            <h1>
                Requests
            </h1>

            <p>
                Healthcare requests received by the hospital.
            </p>

        </div>


        <div class="empty">

            <i class="fa-solid fa-file-medical"></i>

            <h3>
                No requests
            </h3>

            <p>
                New requests will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   PROFILE
========================================================= */

function profilePage(role) {

    const data =
        state[role];


    const roleInfo =
        roles[role];


    const fields =
        profileFields(role);


    return `

        <div class="page-heading">

            <div class="eyebrow">
                ${roleInfo.name.toUpperCase()}
            </div>

            <h1>
                ${roleInfo.name} Profile
            </h1>

            <p>
                Manage your account information.
            </p>

        </div>


        <div class="card">

            <div class="profile-header">

                <div class="profile-avatar">

                    <i class="fa-solid ${roleInfo.icon}"></i>

                </div>

                <div>

                    <h2>
                        ${esc(data.name || roleInfo.name)}
                    </h2>

                    <p>
                        ${roleInfo.subtitle}
                    </p>

                </div>

            </div>


            <form
                id="profileForm"
                class="form-grid"
                data-profile-role="${role}"
            >

                ${fields}


                <div class="form-actions full">

                    <button
                        class="btn btn-primary"
                        type="submit"
                    >

                        <i class="fa-solid fa-floppy-disk"></i>

                        Save Changes

                    </button>

                </div>

            </form>

        </div>

    `;

}


function profileFields(role) {

    const d =
        state[role];


    if (role === "user") {

        return `

            ${inputField(
                "Name",
                "name",
                d.name,
                "Enter your name"
            )}

            ${inputField(
                "Email",
                "email",
                d.email,
                "Enter email",
                "email"
            )}

            ${inputField(
                "Phone",
                "phone",
                d.phone,
                "Enter phone"
            )}

            ${inputField(
                "City / Location",
                "city",
                d.city,
                "Enter city"
            )}

            ${inputField(
                "Blood Group",
                "bloodGroup",
                d.bloodGroup,
                "e.g. O+"
            )}

            ${inputField(
                "Address",
                "address",
                d.address,
                "Enter address"
            )}

        `;

    }


    if (role === "donor") {

        return `
            ${inputField("Name", "name", d.name, "Enter donor name")}
            ${inputField("Email", "email", d.email, "Enter email", "email")}
            ${inputField("Phone", "phone", d.phone, "Enter phone")}
            ${inputField("City", "city", d.city, "Enter city")}
            ${inputField("Blood Group", "bloodGroup", d.bloodGroup, "e.g. O+")}
            ${inputField("Age", "age", d.age, "Enter age", "number")}
            ${inputField("Gender", "gender", d.gender, "Enter gender")}
            ${inputField("Address", "address", d.address, "Enter address")}
        `;

    }


    if (role === "pharmacy") {

        return `

            ${inputField(
                "Store Name",
                "name",
                d.name,
                "Enter store name"
            )}

            ${inputField(
                "Owner Name",
                "owner",
                d.owner,
                "Enter owner name"
            )}

            ${inputField(
                "Email",
                "email",
                d.email,
                "Enter email",
                "email"
            )}

            ${inputField(
                "Phone",
                "phone",
                d.phone,
                "Enter phone"
            )}

            ${inputField(
                "City",
                "city",
                d.city,
                "Enter city"
            )}

            ${inputField(
                "Address",
                "address",
                d.address,
                "Enter store address"
            )}

        `;

    }


    if (role === "oxygen") {

        return `

            ${inputField(
                "Provider Name",
                "name",
                d.name,
                "Enter provider name"
            )}

            ${inputField(
                "Owner Name",
                "owner",
                d.owner,
                "Enter owner name"
            )}

            ${inputField(
                "Email",
                "email",
                d.email,
                "Enter email",
                "email"
            )}

            ${inputField(
                "Phone",
                "phone",
                d.phone,
                "Enter phone"
            )}

            ${inputField(
                "City",
                "city",
                d.city,
                "Enter city"
            )}

            ${inputField(
                "Address",
                "address",
                d.address,
                "Enter address"
            )}

        `;

    }


    if (role === "doctor") {

        return `

            ${inputField(
                "Doctor Name",
                "name",
                d.name,
                "Enter doctor name"
            )}

            ${inputField(
                "Specialization",
                "specialization",
                d.specialization,
                "e.g. Cardiologist"
            )}

            ${inputField(
                "Qualification",
                "qualification",
                d.qualification,
                "e.g. MBBS, MD"
            )}

            ${inputField(
                "Experience",
                "experience",
                d.experience,
                "e.g. 5 years"
            )}

            ${inputField(
                "Email",
                "email",
                d.email,
                "Enter email",
                "email"
            )}

            ${inputField(
                "Phone",
                "phone",
                d.phone,
                "Enter phone"
            )}

            ${inputField(
                "City",
                "city",
                d.city,
                "Enter city"
            )}

        `;

    }


    if (role === "hospital") {

        return `
            ${inputField("Hospital Name", "name", d.name, "Enter hospital name")}
            ${inputField("Email", "email", d.email, "Enter email", "email")}
            ${inputField("Phone", "phone", d.phone, "Enter phone")}
            ${inputField("City", "city", d.city, "Enter city")}
            ${inputField("Address", "address", d.address, "Enter address")}
            ${inputField("Total Beds", "beds", d.beds, "Enter total beds", "number")}
            ${inputField("Available Beds", "availableBeds", d.availableBeds, "Enter available beds", "number")}
        `;

    }


    return "";

}


function inputField(
    label,
    name,
    value,
    placeholder,
    type = "text"
) {

    return `

        <div class="form-group">

            <label>
                ${label}
            </label>

            <input
                name="${name}"
                type="${type}"
                value="${esc(value || "")}"
                placeholder="${placeholder}"
            >

        </div>

    `;

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function notificationsPage() {

    const notifications =
        state.notifications.filter(
            n =>
                n.role === state.role
        );


    return `

        <div class="page-heading">

            <div class="eyebrow">
                NOTIFICATIONS
            </div>

            <h1>
                Notifications
            </h1>

            <p>
                Important updates related to your account.
            </p>

        </div>


        ${
            notifications.length
                ? `
                    <div style="margin-bottom:15px">

                        <button
                            class="btn btn-secondary btn-small"
                            data-mark-read
                            type="button"
                        >

                            <i class="fa-solid fa-check-double"></i>

                            Mark All as Read

                        </button>

                    </div>


                    ${notifications
                        .map(
                            notificationCard
                        )
                        .join("")}
                `
                : `
                    <div class="empty">

                        <i class="fa-solid fa-bell-slash"></i>

                        <h3>
                            No notifications
                        </h3>

                        <p>
                            There are no notifications for this account.
                        </p>

                    </div>
                `
        }

    `;

}


function notificationCard(n) {

    return `

        <div class="notification ${
            n.read ? "" : "unread"
        }">

            <div class="notification-icon">

                <i class="fa-solid ${
                    n.icon || "fa-bell"
                }"></i>

            </div>


            <div class="notification-content">

                <h3>
                    ${esc(n.title)}
                </h3>

                <p>
                    ${esc(n.message)}
                </p>

            </div>


            <div class="notification-time">

                ${esc(n.date || "")}

            </div>

        </div>

    `;

}


/* =========================================================
   SETTINGS
========================================================= */

function settingsPage() {

    const s =
        state.settings;


    return `

        <div class="page-heading">

            <div class="eyebrow">
                ACCOUNT SETTINGS
            </div>

            <h1>
                Settings
            </h1>

            <p>
                Manage your notification preferences.
            </p>

        </div>


        <div class="card">

            <div class="toggle-row">

                <div class="toggle-text">

                    <strong>
                        Email Notifications
                    </strong>

                    <span>
                        Receive important account updates by email.
                    </span>

                </div>


                ${toggle(
                    "emailNotifications",
                    s.emailNotifications
                )}

            </div>


            <div class="toggle-row">

                <div class="toggle-text">

                    <strong>
                        Appointment Reminders
                    </strong>

                    <span>
                        Receive reminders about appointments.
                    </span>

                </div>


                ${toggle(
                    "appointmentReminders",
                    s.appointmentReminders
                )}

            </div>


            <div class="toggle-row">

                <div class="toggle-text">

                    <strong>
                        Request Notifications
                    </strong>

                    <span>
                        Receive notifications about healthcare requests.
                    </span>

                </div>


                ${toggle(
                    "requestNotifications",
                    s.requestNotifications
                )}

            </div>

        </div>


        <div class="section">

            <button
                class="btn btn-danger"
                data-reset-data
                type="button"
            >

                <i class="fa-solid fa-trash"></i>

                Reset Frontend Data

            </button>

        </div>

    `;

}


function toggle(name, checked) {

    return `

        <label class="toggle">

            <input
                type="checkbox"
                data-setting="${name}"
                ${
                    checked
                        ? "checked"
                        : ""
                }
            >

            <span class="slider"></span>

        </label>

    `;

}


/* =========================================================
   DONOR REGISTRATION HANDLER
========================================================= */

async function handleDonorRegistration(event) {

    event.preventDefault();


    const form =
        new FormData(event.target);


    const name =
        String(
            form.get("name") || ""
        ).trim();


    const phone =
        String(
            form.get("phone") || ""
        ).trim();


    const age =
        Number(
            form.get("age")
        );


    const bloodGroup =
        String(
            form.get("blood_group") || ""
        ).trim();


    const gender =
        String(
            form.get("gender") || ""
        ).trim();


    const city =
        String(
            form.get("city") || ""
        ).trim();


    const address =
        String(
            form.get("address") || ""
        ).trim();


    const availability =
        String(
            form.get("availability") || ""
        ).trim();


    if (!name) {

        toast(
            "Please enter your full name.",
            "error"
        );

        return;

    }


    if (!phone) {

        toast(
            "Please enter your phone number.",
            "error"
        );

        return;

    }


    if (!age || age < 18 || age > 65) {

        toast(
            "Donor age must be between 18 and 65.",
            "error"
        );

        return;

    }


    if (!bloodGroup) {

        toast(
            "Please select your blood group.",
            "error"
        );

        return;

    }


    if (!gender) {

        toast(
            "Please select your gender.",
            "error"
        );

        return;

    }


    if (!city) {

        toast(
            "Please enter your city.",
            "error"
        );

        return;

    }


    if (!address) {

        toast(
            "Please enter your address.",
            "error"
        );

        return;

    }


    if (!availability) {

        toast(
            "Please select your availability.",
            "error"
        );

        return;

    }


    const donorData = {

        name: name,

        blood_group: bloodGroup,

        age: age,

        gender: gender,

        phone: phone,

        city: city,

        address: address,

        availability: availability === "available"

    };


    try {

        const result =
            await apiPost(
                "/donors/register",
                donorData
            );


        if (
            !result ||
            result.error
        ) {

            toast(
                result?.error ||
                "Unable to register as donor.",
                "error"
            );

            return;

        }


        /*
         * Save donor information locally
         * only after the database confirms
         * successful registration.
         */

        state.donor = {

            ...state.donor,

            id:
                result.donor?.id ||
                state.donor.id,

            name:
                result.donor?.name ||
                name,

            bloodGroup:
                result.donor?.blood_group ||
                bloodGroup,

            age:
                result.donor?.age ||
                age,

            gender:
                result.donor?.gender ||
                gender,

            phone:
                result.donor?.phone ||
                phone,

            city:
                result.donor?.city ||
                city,

            address:
                result.donor?.address ||
                address,

            available:
                result.donor?.available ??
                donorData.availability

        };


        saveState();


        toast(
            "You are successfully registered as a blood donor."
        );


        /*
         * Open the existing donor dashboard.
         */

        state.role = "donor";

        saveState();

        navigate("dashboard");


    } catch (error) {

        console.error(
            "Donor registration error:",
            error
        );

        toast(
            "Unable to connect to the server.",
            "error"
        );

    }

}


/* =========================================================
   APPLICATION EVENTS
========================================================= */

function bindApplicationEvents() {

    /* -----------------------------------------
       Navigation
    ----------------------------------------- */

    document
        .querySelectorAll("[data-nav]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {

                    const page =
                        element.dataset.nav;

                    navigate(page);

                }
            );

        });


    /* -----------------------------------------
       Mobile menu
    ----------------------------------------- */

    const menu =
        document.getElementById(
            "menuButton"
        );


    if (menu) {

        menu.addEventListener(
            "click",
            () => {

                document
                    .getElementById("sidebar")
                    .classList.toggle("open");

            }
        );

    }


    /* -----------------------------------------
       Switch role
    ----------------------------------------- */

    document
        .querySelectorAll("[data-switch-role]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedRole =
                        state.role;

                    renderLogin();

                }
            );

        });


    /* -----------------------------------------
       Logout
    ----------------------------------------- */

    document
        .querySelectorAll("[data-logout]")
        .forEach(button => {

            button.addEventListener(
                "click",
                logout
            );

        });


    /* -----------------------------------------
       Service cards
    ----------------------------------------- */

    document
        .querySelectorAll(".service-card[data-nav]")
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    navigate(
                        card.dataset.nav
                    );

                }
            );

            card.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Enter" || event.key === " ") {

                        event.preventDefault();

                        navigate(card.dataset.nav);

                    }

                }
            );

        });


    /* -----------------------------------------
       Donor registration
    ----------------------------------------- */

    const donorRegistrationForm =
        document.getElementById(
            "donorRegistrationForm"
        );

    if (donorRegistrationForm) {

        donorRegistrationForm.addEventListener(
            "submit",
            handleDonorRegistration
        );

    }


    /* -----------------------------------------
       Global search
    ----------------------------------------- */

    const globalSearch =
        document.getElementById(
            "globalSearch"
        );


    if (globalSearch) {

        globalSearch.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !== "Enter"
                ) {
                    return;
                }


                const value =
                    globalSearch.value
                        .trim()
                        .toLowerCase();


                if (!value) {
                    return;
                }


                if (
                    value.includes("blood")
                ) {

                    navigate("blood");

                } else if (
                    value.includes("medicine") ||
                    value.includes("tablet")
                ) {

                    navigate("medicine");

                } else if (
                    value.includes("oxygen")
                ) {

                    navigate("oxygen");

                } else if (
                    value.includes("doctor")
                ) {

                    navigate("doctors");

                } else if (
                    value.includes("hospital")
                ) {

                    navigate("hospitals");

                } else {

                    toast(
                        "Try searching blood, medicine, oxygen, doctor or hospital."
                    );

                }

            }
        );

    }


    /* -----------------------------------------
       Dashboard search
    ----------------------------------------- */

    const dashboardSearch =
        document.getElementById(
            "dashboardSearch"
        );


    if (dashboardSearch) {

        dashboardSearch.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const query =
                    new FormData(
                        dashboardSearch
                    )
                    .get("query")
                    .toLowerCase();


                if (query.includes("blood")) {

                    navigate("blood");

                } else if (
                    query.includes("medicine") ||
                    query.includes("tablet")
                ) {

                    navigate("medicine");

                } else if (
                    query.includes("oxygen")
                ) {

                    navigate("oxygen");

                } else if (
                    query.includes("doctor")
                ) {

                    navigate("doctors");

                } else if (
                    query.includes("hospital")
                ) {

                    navigate("hospitals");

                } else {

                    toast(
                        "Please search for blood, medicine, oxygen, doctor or hospital."
                    );

                }

            }
        );

    }


    /* -----------------------------------------
       Blood search
    ----------------------------------------- */

    const bloodForm =
        document.getElementById(
            "bloodSearchForm"
        );


    if (bloodForm) {

        bloodForm.addEventListener(
            "submit",
            handleBloodSearch
        );

    }


    /* -----------------------------------------
       Medicine search
    ----------------------------------------- */

    const medicineForm =
        document.getElementById(
            "medicineSearchForm"
        );


    if (medicineForm) {

        medicineForm.addEventListener(
            "submit",
            handleMedicineSearch
        );

    }


    /* -----------------------------------------
       Oxygen search
    ----------------------------------------- */

    const oxygenForm =
        document.getElementById(
            "oxygenSearchForm"
        );


    if (oxygenForm) {

        oxygenForm.addEventListener(
            "submit",
            handleOxygenSearch
        );

    }


    /* -----------------------------------------
       Doctor search
    ----------------------------------------- */

    const doctorForm =
        document.getElementById(
            "doctorSearchForm"
        );


    if (doctorForm) {

        doctorForm.addEventListener(
            "submit",
            handleDoctorSearch
        );

    }


    /* -----------------------------------------
       Hospital search
    ----------------------------------------- */

    const hospitalForm =
        document.getElementById(
            "hospitalSearchForm"
        );


    if (hospitalForm) {

        hospitalForm.addEventListener(
            "submit",
            handleHospitalSearch
        );

    }

    /* =========================================================
   DONOR REGISTRATION HANDLER
========================================================= */


    /* -----------------------------------------
       Donor availability
    ----------------------------------------- */

    const donorAvailability =
        document.getElementById(
            "donorAvailable"
        );


    if (donorAvailability) {

        donorAvailability.addEventListener(
    "change",
    async () => {

        const isAvailable =
            donorAvailability.checked;


        const result =
            await apiPut(
                "/donors/availability",
                {
                    available:
                        isAvailable
                }
            );


        if (
            !result ||
            result.error
        ) {

            toast(
                result?.error ||
                "Could not update availability. Register as a donor first.",
                "error"
            );

            donorAvailability.checked =
                !isAvailable;

            return;

        }


        state.donor.available =
            isAvailable;

        saveState();


        toast(
            isAvailable
                ? "You are now available."
                : "You are now unavailable."
        );


        renderApp(
            "availability"
        );

    }
);

    }


    /* -----------------------------------------
       Generic availability
    ----------------------------------------- */

    const providerAvailability =
        document.getElementById(
            "providerAvailability"
        );


    if (providerAvailability) {

        providerAvailability.addEventListener(
            "change",
            async () => {

                const available =
                    providerAvailability.checked;

                if (state.role === "pharmacy") {

                    state.pharmacy.available =
                        available;

                    const account =
                        state.pharmacy;

                    const result =
                        await apiPost(
                            "/pharmacy/profile",
                            {
                                name: account.name || "",
                                owner_name: account.owner || "",
                                email: account.email || "",
                                phone: account.phone || "",
                                city: account.city || "",
                                address: account.address || "",
                                availability: available
                            }
                        );

                    if (!result || result.error) {
                        toast(
                            result?.error ||
                            "Could not update availability.",
                            "error"
                        );
                        return;
                    }

                    saveState();

                    toast(
                        available
                            ? "Availability enabled."
                            : "Availability disabled."
                    );

                    return;
                }

                if (state.role === "oxygen") {

                    state.oxygen.available =
                        available;

                    const account =
                        state.oxygen;

                    const success =
                        await saveOxygenProviderProfile(
                            account.name || "",
                            account.owner || "",
                            account.email || "",
                            account.phone || "",
                            account.city || "",
                            account.address || "",
                            available
                        );

                    if (!success) {
                        return;
                    }

                    saveState();

                    toast(
                        available
                            ? "Availability enabled."
                            : "Availability disabled."
                    );

                    return;
                }

                toast(
                    available
                        ? "Availability enabled."
                        : "Availability disabled."
                );

            }
        );

    }


    /* -----------------------------------------
       Profile form
    ----------------------------------------- */

    const profileForm =
        document.getElementById(
            "profileForm"
        );


    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            handleProfileSave
        );

    }


    /* -----------------------------------------
       Settings
    ----------------------------------------- */

    document
        .querySelectorAll("[data-setting]")
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const setting =
                        input.dataset.setting;

                    state.settings[setting] =
                        input.checked;

                    saveState();

                    toast(
                        "Setting updated."
                    );

                }
            );

        });


    /* -----------------------------------------
       Notifications
    ----------------------------------------- */

    const markRead =
        document.querySelector(
            "[data-mark-read]"
        );


    if (markRead) {

        markRead.addEventListener(
            "click",
            markAllNotificationsRead
        );

    }


    /* -----------------------------------------
       Reset
    ----------------------------------------- */

    const reset =
        document.querySelector(
            "[data-reset-data]"
        );


    if (reset) {

        reset.addEventListener(
            "click",
            resetData
        );

    }


    /* -----------------------------------------
       Pharmacy
    ----------------------------------------- */

    const addMedicine =
        document.querySelector(
            "[data-add-medicine]"
        );


    if (addMedicine) {

        addMedicine.addEventListener(
            "click",
            () => openMedicineModal()
        );

    }


    document
        .querySelectorAll("[data-edit-medicine]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openMedicineModal(
                        button.dataset.editMedicine
                    )
            );

        });


    document
        .querySelectorAll("[data-delete-medicine]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteMedicine(
                        button.dataset.deleteMedicine
                    )
            );

        });


    /* -----------------------------------------
       Oxygen
    ----------------------------------------- */

    const addOxygen =
        document.querySelector(
            "[data-add-oxygen]"
        );


    if (addOxygen) {

        addOxygen.addEventListener(
            "click",
            () => openOxygenModal()
        );

    }


    document
        .querySelectorAll("[data-edit-oxygen]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openOxygenModal(
                        button.dataset.editOxygen
                    )
            );

        });


    document
        .querySelectorAll("[data-delete-oxygen]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteOxygen(
                        button.dataset.deleteOxygen
                    )
            );

        });


    /* -----------------------------------------
       Donor requests
    ----------------------------------------- */

    document
        .querySelectorAll("[data-accept-request]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    updateBloodRequest(
                        button.dataset.acceptRequest,
                        "Accepted"
                    )
            );

        });


    document
        .querySelectorAll("[data-decline-request]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    updateBloodRequest(
                        button.dataset.declineRequest,
                        "Declined"
                    )
            );

        });


    /* -----------------------------------------
       Hospital beds
    ----------------------------------------- */

    const bedsForm =
        document.getElementById(
            "bedsForm"
        );


    if (bedsForm) {

        bedsForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const form =
                    new FormData(bedsForm);


                const beds =
                    Number(
                        form.get("beds")
                    );


                const availableBeds =
                    Number(
                        form.get("availableBeds")
                    );


                if (
                    availableBeds > beds
                ) {

                    toast(
                        "Available beds cannot exceed total beds.",
                        "error"
                    );

                    return;

                }


                state.hospital.beds =
                    beds;

                state.hospital.availableBeds =
                    availableBeds;


                saveState();

                toast(
                    "Bed availability updated."
                );

                renderApp("beds");

            }
        );

    }


    /* -----------------------------------------
       Hospital doctors
    ----------------------------------------- */

    const addDoctor =
        document.querySelector(
            "[data-add-doctor]"
        );


    if (addDoctor) {

        addDoctor.addEventListener(
            "click",
            openDoctorModal
        );

    }


    document
        .querySelectorAll("[data-delete-doctor]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.doctors =
                        state.doctors.filter(
                            d =>
                                d.id !==
                                button.dataset.deleteDoctor
                        );

                    saveState();

                    toast(
                        "Doctor removed."
                    );

                    renderApp("doctors");

                }
            );

        });


    /* -----------------------------------------
       Stock button
    ----------------------------------------- */

    const stockAdd =
        document.querySelector(
            "[data-stock-add]"
        );


    if (stockAdd) {

        stockAdd.addEventListener(
            "click",
            () => {

                toast(
                    "Stock management form can be connected to your database next."
                );

            }
        );

    }

}


/* =========================================================
   BLOOD SEARCH HANDLER
========================================================= */

async function handleBloodSearch(event) {

    event.preventDefault();


    const form =
        new FormData(event.target);


    const group =
        form.get("bloodGroup");


    const city =
        form.get("city");


    const units =
        form.get("units");


    const urgency =
        form.get("urgency");


    const cleanUnits =
        units.replace(/\D/g, "") || "1";


    const results =
        document.getElementById(
            "bloodResults"
        );


    results.innerHTML = `

        <div class="empty">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <h3>
                Searching...
            </h3>

        </div>

    `;


    /* -----------------------------------------
       Search real blood_records via backend API
       (encodeURIComponent handles the "+" in
       blood groups like "O+" correctly)
    ----------------------------------------- */

    try {

        const query =
            `bloodGroup=${encodeURIComponent(group)}` +
            `&city=${encodeURIComponent(city)}`;

        const res =
            await fetch(
                `${API_BASE}/blood/search?${query}`
            );

        const data =
            await res.json();

        const matches =
            data.results || [];


        if (matches.length) {

            results.innerHTML = `

                <div class="results-header">

                    <h3>
                        Available Blood
                    </h3>

                    <span class="badge green">
                        ${matches.length} result(s)
                    </span>

                </div>


                ${matches.map(
                    bloodResultDb
                ).join("")}

            `;

        } else {

            results.innerHTML = `

                <div class="empty">

                    <i class="fa-solid fa-database"></i>

                    <h3>
                        No database results available
                    </h3>

                    <p>
                        No real blood records currently match
                        ${esc(group)} in ${esc(city)}.
                    </p>

                </div>

            `;

        }

    } catch (err) {

        console.error(err);

        results.innerHTML = `

            <div class="empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Could not reach server
                </h3>

                <p>
                    Make sure the backend server is running.
                </p>

            </div>

        `;

    }


    /* -----------------------------------------
       Also save the request to the real
       blood_requests table via backend API
    ----------------------------------------- */

    try {

        await apiPost(
            "/blood/request",
            {
                userId: null,
                bloodGroup: group,
                city: city,
                units: cleanUnits,
                urgency: urgency
            }
        );

        toast(
            "Blood request saved."
        );

    } catch (err) {

        console.error(err);

    }

}



function bloodResultDb(record) {
    const isRegisteredDonor =
        record.source === "donor" &&
        typeof record.id === "string" &&
        record.id.startsWith("donor-");

    return `
        <div class="result-card">
            <div class="result-main">
                <div class="result-icon">
                    <i class="fa-solid fa-droplet"></i>
                </div>

                <div>
                    <h3>${esc(record.name || "Blood donor")}</h3>
                    <p>Blood Group: ${esc(record.blood_group || "")}</p>
                    <p>${esc(record.city || "")} · ${esc(record.units ?? 1)} unit(s)</p>

                    ${record.contact_phone ? `
                        <p>
                            <i class="fa-solid fa-phone"></i>
                            ${esc(record.contact_phone)}
                        </p>
                    ` : ""}
                </div>
            </div>

            <div class="result-actions">
                <span class="badge green">Available</span>

                ${isRegisteredDonor ? `
                    <button
                        class="btn btn-primary btn-small"
                        type="button"
                        data-send-blood-request="${esc(record.id)}"
                        data-donor-name="${esc(record.name || "Blood donor")}"
                        data-donor-blood-group="${esc(record.blood_group || "")}"
                        data-donor-city="${esc(record.city || "")}">
                        <i class="fa-solid fa-paper-plane"></i>
                        Send Request
                    </button>
                ` : ""}
            </div>
        </div>
    `;
}


function openBloodRequestModal(donorId, donorName, bloodGroup, city) {
    if (!localStorage.getItem("hc_token")) {
        toast("Please log in before sending a blood request.", "error");
        return;
    }

    openModal("Send Blood Request", `
        <p style="margin-bottom:16px;">
            Send a request to <strong>${esc(donorName)}</strong>.
        </p>

        <form id="bloodRequestModalForm">
            <input type="hidden" name="donorId" value="${esc(donorId)}">

            <div class="form-group">
                <label>Blood Group</label>
                <input name="bloodGroup" value="${esc(bloodGroup)}" readonly required>
            </div>

            <div class="form-group">
                <label>City</label>
                <input name="city" value="${esc(city)}" required>
            </div>

            <div class="form-group">
                <label>Units Required</label>
                <select name="units" required>
                    <option value="1">1 Unit</option>
                    <option value="2">2 Units</option>
                    <option value="3">3 Units</option>
                    <option value="4">4 Units</option>
                    <option value="5">5 Units</option>
                </select>
            </div>

            <div class="form-group">
                <label>Urgency</label>
                <select name="urgency" required>
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                </select>
            </div>

            <div class="form-actions">
                <button class="btn btn-secondary" type="button" data-close-modal>
                    Cancel
                </button>

                <button class="btn btn-primary" type="submit">
                    <i class="fa-solid fa-paper-plane"></i>
                    Send Request
                </button>
            </div>
        </form>
    `);

    const form = document.getElementById("bloodRequestModalForm");
    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');

        submitButton.disabled = true;

        try {
            await apiPost("/blood/request", {
                donorId: formData.get("donorId"),
                bloodGroup: formData.get("bloodGroup"),
                city: String(formData.get("city") || "").trim(),
                units: Number(formData.get("units")),
                urgency: formData.get("urgency")
            });

            closeModal();
            toast("Blood request sent successfully.");

            await loadDatabaseNotifications();
        } catch (error) {
            console.error("Sending blood request failed:", error);
            toast(error.message || "Unable to send blood request.", "error");
            submitButton.disabled = false;
        }
    });
}


async function confirmBloodRequest(requestId) {
    try {
        await apiRequest(
            "PATCH",
            `/blood/requests/${encodeURIComponent(requestId)}/confirm`
        );

        await Promise.all([
            loadBloodRequests(),
            loadDatabaseNotifications()
        ]);

        toast("Blood request confirmed successfully.");
        renderApp("requests");
    } catch (error) {
        console.error("Confirm blood request failed:", error);
        toast(error.message || "Unable to confirm this request.", "error");
    }
}


document.addEventListener("click", async function (event) {
    // SEND BLOOD REQUEST BUTTON
    const sendButton = event.target.closest("[data-send-blood-request]");

    if (sendButton) {
        event.preventDefault();

        openBloodRequestModal(
            sendButton.dataset.sendBloodRequest,
            sendButton.dataset.donorName,
            sendButton.dataset.donorBloodGroup,
            sendButton.dataset.donorCity
        );

        return;
    }

    // CONFIRM BLOOD REQUEST BUTTON
    const confirmButton = event.target.closest("[data-confirm-blood-request]");

    if (confirmButton) {
        event.preventDefault();

        await confirmBloodRequest(
            confirmButton.dataset.confirmBloodRequest
        );
    }
});



function bloodResult(record) {

    return `

        <div class="result-card">

            <div class="result-main">

                <div class="result-icon">

                    <i class="fa-solid fa-droplet"></i>

                </div>

                <div>

                    <h3>
                        ${esc(record.name)}
                    </h3>

                    <p>
                        Blood Group:
                        ${esc(record.bloodGroup)}
                    </p>

                    <p>
                        ${esc(record.city)}
                        ·
                        ${esc(record.units)} units
                    </p>

                </div>

            </div>


            <span class="badge green">
                Available
            </span>

        </div>

    `;

}


/* =========================================================
   MEDICINE SEARCH
========================================================= */

async function handleMedicineSearch(event) {

    event.preventDefault();

    const form = event.target;

    const medicineInput =
        form.querySelector('[name="medicine"]');

    const cityInput =
        form.querySelector('[name="city"]');

    const areaInput =
        form.querySelector('[name="area"]');


    const medicine =
        medicineInput
            ? medicineInput.value.trim()
            : "";

    const city =
        cityInput
            ? cityInput.value.trim()
            : "";

    const area =
        areaInput
            ? areaInput.value.trim()
            : "";


    if (!medicine || !city) {

        toast(
            "Please enter medicine name and city.",
            "error"
        );

        return;
    }


    try {

        const params = new URLSearchParams();

        params.append(
            "medicine",
            medicine
        );

        params.append(
            "city",
            city
        );

        if (area) {

            params.append(
                "area",
                area
            );

        }


        const data =
            await apiGet(
                `/medicines/search?${params.toString()}`
            );


        const results =
            data.results || [];


        const resultsContainer =
            document.getElementById(
                "medicineResults"
            );


        if (!resultsContainer) {

            console.error(
                "medicineResults container not found"
            );

            return;
        }


        if (results.length === 0) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pills"></i>
                    <h3>No medicines found</h3>
                    <p>
                        No matching medicines are
                        currently available in your area.
                    </p>
                </div>
            `;

            return;
        }


        resultsContainer.innerHTML =
            results
                .map(record =>
                    medicineResult(record)
                )
                .join("");


    } catch (error) {

        console.error(
            "Medicine search error:",
            error
        );


        const resultsContainer =
            document.getElementById(
                "medicineResults"
            );


        if (resultsContainer) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Something went wrong</h3>
                    <p>
                        Unable to search medicines.
                        Please try again.
                    </p>
                </div>
            `;

        }

    }

}


function medicineResult(record) {

    return `

        <div class="result-card">

            <div class="result-main">

                <div class="result-icon">

                    <i class="fa-solid fa-pills"></i>

                </div>

                <div>

                    <h3>
                        ${esc(record.name)}
                    </h3>

                    <p>
                        ${esc(record.category)}
                    </p>

                    <p>
                        ${esc(record.city)}
                        ·
                        ${esc(record.area || "")}
                    </p>

                </div>

            </div>


            <div class="result-actions">

                <span class="badge green">
                    ${esc(record.quantity)} in stock
                </span>

                <strong>
                    ₹${esc(record.price)}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   OXYGEN SEARCH
========================================================= */

async function handleOxygenSearch(event) {

    event.preventDefault();

    const form = event.target;

    const typeInput =
        form.querySelector('[name="type"]');

    const cityInput =
        form.querySelector('[name="city"]');


    const type =
        typeInput
            ? typeInput.value.trim()
            : "";

    const city =
        cityInput
            ? cityInput.value.trim()
            : "";


    if (!type || !city) {

        toast(
            "Please select oxygen type and enter city.",
            "error"
        );

        return;
    }


    try {

        const params =
            new URLSearchParams();

        params.append(
            "type",
            type
        );

        params.append(
            "city",
            city
        );


        const data =
            await apiGet(
                `/oxygen/search?${params.toString()}`
            );


        const results =
            data.results || [];


        const resultsContainer =
            document.getElementById(
                "oxygenResults"
            );


        if (!resultsContainer) {

            console.error(
                "oxygenResults container not found"
            );

            return;
        }


        if (results.length === 0) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wind"></i>
                    <h3>No oxygen available</h3>
                    <p>
                        No matching oxygen resources
                        are currently available.
                    </p>
                </div>
            `;

            return;
        }


        resultsContainer.innerHTML =
            results
                .map(record =>
                    oxygenResult(record)
                )
                .join("");


    } catch (error) {

        console.error(
            "Oxygen search error:",
            error
        );


        const resultsContainer =
            document.getElementById(
                "oxygenResults"
            );


        if (resultsContainer) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Something went wrong</h3>
                    <p>
                        Unable to search oxygen.
                        Please try again.
                    </p>
                </div>
            `;

        }

    }

}


function oxygenResult(record) {

    return `

        <div class="result-card">

            <div class="result-main">

                <div class="result-icon">

                    <i class="fa-solid fa-lungs"></i>

                </div>

                <div>

                    <h3>
                        ${esc(record.type)}
                    </h3>

                    <p>
                        ${esc(record.capacity || "")}
                    </p>

                    <p>
                        ${esc(record.city)}
                    </p>

                </div>

            </div>


            <div class="result-actions">

                <span class="badge green">
                    ${esc(record.quantity)} available
                </span>

                <strong>
                    ₹${esc(record.price)}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   DOCTOR SEARCH
========================================================= */

async function handleDoctorSearch(event) {

    event.preventDefault();

    const form = event.target;

    const specializationInput =
        form.querySelector('[name="specialization"]');

    const cityInput =
        form.querySelector('[name="city"]');


    const specialization =
        specializationInput
            ? specializationInput.value.trim()
            : "";

    const city =
        cityInput
            ? cityInput.value.trim()
            : "";


    if (!specialization || !city) {

        toast(
            "Please enter specialization and city.",
            "error"
        );

        return;
    }


    try {

        const params =
            new URLSearchParams();

        params.append(
            "specialization",
            specialization
        );

        params.append(
            "city",
            city
        );


        const data =
            await apiGet(
                `/doctors/search?${params.toString()}`
            );


        const results =
            data.results || [];


        const resultsContainer =
            document.getElementById(
                "doctorResults"
            );


        if (!resultsContainer) {

            console.error(
                "doctorResults container not found"
            );

            return;
        }


        if (results.length === 0) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-md"></i>
                    <h3>No doctors found</h3>
                    <p>
                        No matching doctors are
                        currently available.
                    </p>
                </div>
            `;

            return;
        }


        resultsContainer.innerHTML =
            results
                .map(doctor =>
                    doctorResult(doctor)
                )
                .join("");


    } catch (error) {

        console.error(
            "Doctor search error:",
            error
        );


        const resultsContainer =
            document.getElementById(
                "doctorResults"
            );


        if (resultsContainer) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Something went wrong</h3>
                    <p>
                        Unable to search doctors.
                        Please try again.
                    </p>
                </div>
            `;

        }

    }

}


function doctorResult(doctor) {

    return `

        <div class="result-card">

            <div class="result-main">

                <div class="result-icon">

                    <i class="fa-solid fa-user-doctor"></i>

                </div>

                <div>

                    <h3>
                        ${esc(doctor.name)}
                    </h3>

                    <p>
                        ${esc(doctor.specialization)}
                        ·
                        ${esc(doctor.qualification || "")}
                    </p>

                    <p>
                        ${esc(doctor.city)}
                    </p>

                </div>

            </div>


            <div class="result-actions">

                <span class="badge ${
                    doctor.available
                        ? "green"
                        : "red"
                }">

                    ${
                        doctor.available
                            ? "Available"
                            : "Unavailable"
                    }

                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   HOSPITAL SEARCH
========================================================= */

async function handleHospitalSearch(event) {

    event.preventDefault();

    const form = event.target;

    const nameInput =
        form.querySelector('[name="name"]');

    const cityInput =
        form.querySelector('[name="city"]');


    const name =
        nameInput
            ? nameInput.value.trim()
            : "";

    const city =
        cityInput
            ? cityInput.value.trim()
            : "";


    if (!name || !city) {

        toast(
            "Please enter hospital name and city.",
            "error"
        );

        return;
    }


    try {

        const params =
            new URLSearchParams();

        params.append(
            "name",
            name
        );

        params.append(
            "city",
            city
        );


        const data =
            await apiGet(
                `/hospitals/search?${params.toString()}`
            );


        const results =
            data.results || [];


        const resultsContainer =
            document.getElementById(
                "hospitalResults"
            );


        if (!resultsContainer) {

            console.error(
                "hospitalResults container not found"
            );

            return;
        }


        if (results.length === 0) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hospital"></i>
                    <h3>No hospitals found</h3>
                    <p>
                        No matching hospitals are
                        currently available.
                    </p>
                </div>
            `;

            return;
        }


        resultsContainer.innerHTML =
            results
                .map(hospital =>
                    hospitalResult(hospital)
                )
                .join("");


    } catch (error) {

        console.error(
            "Hospital search error:",
            error
        );


        const resultsContainer =
            document.getElementById(
                "hospitalResults"
            );


        if (resultsContainer) {

            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Something went wrong</h3>
                    <p>
                        Unable to search hospitals.
                        Please try again.
                    </p>
                </div>
            `;

        }

    }

}


function hospitalResult(hospital) {

    return `

        <div class="result-card">

            <div class="result-main">

                <div class="result-icon">

                    <i class="fa-solid fa-hospital"></i>

                </div>

                <div>

                    <h3>
                        ${esc(hospital.name)}
                    </h3>

                    <p>
                        ${esc(hospital.city)}
                    </p>

                    <p>
                        ${esc(hospital.address || "")}
                    </p>

                </div>

            </div>


            <div class="result-actions">

                <span class="badge green">
                    ${esc(hospital.availableBeds || 0)}
                    beds available
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   PROFILE SAVE
========================================================= */

async function handleProfileSave(event) {

    event.preventDefault();

    const role = event.target.dataset.profileRole;
    const form = new FormData(event.target);
    const account = state[role] || {};

    try {

        /* USER / PATIENT PROFILE → MYSQL */
        if (role === "user") {

            const result = await apiPut("/users/profile", {
                name: String(form.get("name") || "").trim(),
                email: String(form.get("email") || "").trim(),
                phone: String(form.get("phone") || "").trim(),
                city: String(form.get("city") || "").trim(),
                blood_group: String(form.get("bloodGroup") || "").trim(),
                address: String(form.get("address") || "").trim()
            });

            if (!result || result.error) {
                toast(result?.error || "Could not save user profile.", "error");
                return;
            }

            if (result.user) {
                state.user = {
                    ...state.user,
                    id: result.user.id,
                    name: result.user.name || "",
                    email: result.user.email || "",
                    phone: result.user.phone || "",
                    city: result.user.city || "",
                    bloodGroup: result.user.blood_group || "",
                    address: result.user.address || ""
                };
            }

            saveState();
            toast("User profile saved successfully.");
            renderApp("profile");
            return;
        }

        /* DONOR PROFILE → MYSQL */
        if (role === "donor") {
            console.log("Saving donor profile:", Object.fromEntries(form.entries()));
            const result = await apiPut("/donors/profile", {
                name: String(form.get("name") || "").trim(),
                email: String(form.get("email") || "").trim(),
                blood_group: String(form.get("bloodGroup") || account.bloodGroup || "").trim(),
                age: form.get("age") || account.age || "",
                gender: form.get("gender") || account.gender || "",
                phone: String(form.get("phone") || "").trim(),
                city: String(form.get("city") || "").trim(),
                address: String(form.get("address") || account.address || "").trim(),
                availability: account.available !== false
            });
                console.log("Donor profile API response:", result);
            if (!result || result.error) {
                toast(result?.error || "Could not save donor profile.", "error");
                return;
            }

            if (result.donor) {
                state.donor = {
                    ...state.donor,
                    id: result.donor.id || state.donor.id,
                    name: result.donor.name || "",
                    email: result.donor.email || "",
                    bloodGroup: result.donor.blood_group || "",
                    age: result.donor.age ?? "",
                    gender: result.donor.gender || "",
                    phone: result.donor.phone || "",
                    city: result.donor.city || "",
                    address: result.donor.address || "",
                    available: result.donor.available ?? true
                };
            }

            saveState();
            toast("Donor profile saved successfully.");
            renderApp("profile");
            return;
        }

        /* PHARMACY PROFILE → MYSQL */
        if (role === "pharmacy") {

            const result = await apiPost("/pharmacy/profile", {
                name: String(form.get("name") || "").trim(),
                owner_name: String(form.get("owner") || "").trim(),
                email: String(form.get("email") || "").trim(),
                phone: String(form.get("phone") || "").trim(),
                city: String(form.get("city") || "").trim(),
                address: String(form.get("address") || "").trim(),
                availability: account.available !== false
            });

            if (!result || result.error) {
                toast(result?.error || "Could not save pharmacy profile.", "error");
                return;
            }

            await loadPharmacyProfile();
            toast("Pharmacy profile saved successfully.");
            renderApp("profile");
            return;
        }

        /* OXYGEN PROVIDER PROFILE → MYSQL */
        if (role === "oxygen") {

            const result = await saveOxygenProviderProfile(
                String(form.get("name") || "").trim(),
                String(form.get("owner") || "").trim(),
                String(form.get("email") || "").trim(),
                String(form.get("phone") || "").trim(),
                String(form.get("city") || "").trim(),
                String(form.get("address") || "").trim(),
                account.available !== false
            );

            if (!result) return;

            await loadOxygenProviderProfile();
            toast("Oxygen provider profile saved successfully.");
            renderApp("profile");
            return;
        }

        /* DOCTOR PROFILE → MYSQL */
        if (role === "doctor") {

            const result = await apiPost("/doctors/profile", {
                name: String(form.get("name") || "").trim(),
                specialization: String(form.get("specialization") || "").trim(),
                qualification: String(form.get("qualification") || "").trim(),
                experience: String(form.get("experience") || "").trim(),
                email: String(form.get("email") || "").trim(),
                phone: String(form.get("phone") || "").trim(),
                city: String(form.get("city") || "").trim(),
                availability: account.available !== false
            });

            if (!result || result.error) {
                toast(result?.error || "Could not save doctor profile.", "error");
                return;
            }

            if (result.doctor) {
                state.doctor = {
                    ...state.doctor,
                    ...result.doctor,
                    available: result.doctor.available ?? true
                };
            }

            saveState();
            toast("Doctor profile saved successfully.");
            renderApp("profile");
            return;
        }

        /* HOSPITAL PROFILE → MYSQL */
        if (role === "hospital") {

            const result = await apiPost("/hospitals/profile", {
                name: String(form.get("name") || "").trim(),
                email: String(form.get("email") || "").trim(),
                phone: String(form.get("phone") || "").trim(),
                city: String(form.get("city") || "").trim(),
                address: String(form.get("address") || "").trim(),
                beds: Number(account.beds) || 0,
                available_beds: Number(account.availableBeds) || 0,
                availability: account.available !== false
            });

            if (!result || result.error) {
                toast(result?.error || "Could not save hospital profile.", "error");
                return;
            }

            if (result.hospital) {
                state.hospital = {
                    ...state.hospital,
                    ...result.hospital,
                    availableBeds: result.hospital.available_beds ?? 0
                };
            }

            saveState();
            toast("Hospital profile saved successfully.");
            renderApp("profile");
            return;
        }

        toast("Unsupported profile role.", "error");

    } catch (error) {
        console.error("Profile save error:", error);
        toast("Unable to save profile to the database.", "error");
    }
}

/* =========================================================
   MEDICINE MODAL
========================================================= */

function openMedicineModal(existingId = null) {

    const existing =
        state.medicineRecords.find(
            item =>
                item.id === existingId
        );


    openModal(
        existing
            ? "Edit Medicine"
            : "Add Medicine",
        `

            <form
                id="medicineModalForm"
                class="form-grid"
            >

                <input
                    type="hidden"
                    name="id"
                    value="${esc(existing?.id || "")}"
                >


                ${inputField(
                    "Medicine Name",
                    "name",
                    existing?.name || "",
                    "e.g. Paracetamol"
                )}


                ${inputField(
                    "Adreess/Contact No.",
                    "category",
                    existing?.category || "",
                    "e.g. Andheri undder DN nagar metro station/98736372"
                )}


                ${inputField(
                    "Quantity",
                    "quantity",
                    existing?.quantity || 0,
                    "Enter quantity",
                    "number"
                )}


                ${inputField(
                    "Price",
                    "price",
                    existing?.price || 0,
                    "Enter price",
                    "number"
                )}


                ${inputField(
                    "City",
                    "city",
                    existing?.city || "",
                    "e.g. Mumbai"
                )}


                ${inputField(
                    "Area",
                    "area",
                    existing?.area || "",
                    "e.g. Andheri"
                )}


                <div class="form-actions full">

                    <button
                        class="btn btn-secondary"
                        data-close-modal
                        type="button"
                    >
                        Cancel
                    </button>


                    <button
                        class="btn btn-primary"
                        type="submit"
                    >

                        <i class="fa-solid fa-floppy-disk"></i>

                        Save Medicine

                    </button>

                </div>

            </form>

        `
    );


    document
        .getElementById(
            "medicineModalForm"
        )
        .addEventListener(
            "submit",
            saveMedicine
        );

}


/* =========================================================
   SAVE MEDICINE
========================================================= */

async function saveMedicine(event) {

    event.preventDefault();

    const form = new FormData(event.target);
    const recordId = form.get("id");

    const record = {
        name: form.get("name"),
        category: form.get("category"),
        quantity: Number(form.get("quantity")) || 0,
        price: Number(form.get("price")) || 0,
        city: form.get("city"),
        area: form.get("area")
    };

    let success = false;

    if (recordId) {
        success = await updatePharmacyMedicine(
            recordId,
            record.name,
            record.category,
            record.quantity,
            record.price,
            record.city,
            record.area
        );
    } else {
        success = await addPharmacyMedicine(
            record.name,
            record.category,
            record.quantity,
            record.price,
            record.city,
            record.area
        );
    }

    if (!success) {
        return;
    }

    await loadPharmacyMedicines();
    closeModal();
    renderApp("inventory");

}


/* =========================================================
   DELETE MEDICINE
========================================================= */

async function deleteMedicine(recordId) {

    if (!confirm("Delete this medicine from inventory?")) {
        return;
    }

    const success =
        await deletePharmacyMedicine(recordId);

    if (!success) {
        return;
    }

    await loadPharmacyMedicines();
    renderApp("inventory");

}


/* =========================================================
   OXYGEN MODAL
========================================================= */

function openOxygenModal(existingId = null) {

    const existing =
        state.oxygenRecords.find(
            item =>
                item.id === existingId
        );


    openModal(
        existing
            ? "Edit Oxygen"
            : "Add Oxygen",
        `

            <form
                id="oxygenModalForm"
                class="form-grid"
            >

                <input
                    type="hidden"
                    name="id"
                    value="${esc(existing?.id || "")}"
                >


                <div class="form-group">

                    <label>
                        Oxygen Type
                    </label>

                    <select name="type">

                        <option ${
                            existing?.type ===
                            "Oxygen Cylinder"
                                ? "selected"
                                : ""
                        }>
                            Oxygen Cylinder
                        </option>

                        <option ${
                            existing?.type ===
                            "Oxygen Concentrator"
                                ? "selected"
                                : ""
                        }>
                            Oxygen Concentrator
                        </option>

                    </select>

                </div>


                ${inputField(
                    "Contact Number",
                    "capacity",
                    existing?.capacity || "",
                    "e.g. 9647895467"
                )}


                ${inputField(
                    "Quantity",
                    "quantity",
                    existing?.quantity || 0,
                    "Enter quantity",
                    "number"
                )}


                ${inputField(
                    "Price",
                    "price",
                    existing?.price || 0,
                    "Enter price",
                    "number"
                )}


                ${inputField(
                    "City",
                    "city",
                    existing?.city || "",
                    "e.g. Mumbai"
                )}


                <div class="form-actions full">

                    <button
                        class="btn btn-secondary"
                        data-close-modal
                        type="button"
                    >
                        Cancel
                    </button>


                    <button
                        class="btn btn-primary"
                        type="submit"
                    >

                        <i class="fa-solid fa-floppy-disk"></i>

                        Save Oxygen

                    </button>

                </div>

            </form>

        `
    );


    document
        .getElementById(
            "oxygenModalForm"
        )
        .addEventListener(
            "submit",
            saveOxygen
        );

}


/* =========================================================
   SAVE OXYGEN
========================================================= */

async function saveOxygen(event) {

    event.preventDefault();

    const form = new FormData(event.target);
    const recordId = form.get("id");

    const record = {
        type: form.get("type"),
        capacity: form.get("capacity"),
        quantity: Number(form.get("quantity")) || 0,
        price: Number(form.get("price")) || 0,
        city: form.get("city")
    };

    let success = false;

    if (recordId) {
        success = await updateOxygenInventory(
            recordId,
            record.type,
            record.capacity,
            record.quantity,
            record.price,
            record.city
        );
    } else {
        success = await addOxygenInventory(
            record.type,
            record.capacity,
            record.quantity,
            record.price,
            record.city
        );
    }

    if (!success) {
        return;
    }

    await loadOxygenInventory();
    closeModal();
    renderApp("inventory");

}


/* =========================================================
   DELETE OXYGEN
========================================================= */

async function deleteOxygen(recordId) {

    if (!confirm("Delete this oxygen record?")) {
        return;
    }

    const success =
        await deleteOxygenInventory(recordId);

    if (!success) {
        return;
    }

    await loadOxygenInventory();
    renderApp("inventory");

}


/* =========================================================
   DOCTOR MODAL
========================================================= */

function openDoctorModal() {

    openModal(
        "Add Doctor",
        `

            <form
                id="doctorModalForm"
                class="form-grid"
            >

                ${inputField(
                    "Doctor Name",
                    "name",
                    "",
                    "Enter doctor name"
                )}


                ${inputField(
                    "Specialization",
                    "specialization",
                    "",
                    "e.g. Cardiologist"
                )}


                ${inputField(
                    "Qualification",
                    "qualification",
                    "",
                    "e.g. MBBS, MD"
                )}


                ${inputField(
                    "Phone",
                    "phone",
                    "",
                    "Enter phone"
                )}


                ${inputField(
                    "City",
                    "city",
                    state.hospital.city,
                    "Enter city"
                )}


                <div class="form-actions full">

                    <button
                        class="btn btn-secondary"
                        data-close-modal
                        type="button"
                    >
                        Cancel
                    </button>


                    <button
                        class="btn btn-primary"
                        type="submit"
                    >

                        <i class="fa-solid fa-plus"></i>

                        Add Doctor

                    </button>

                </div>

            </form>

        `
    );


    document
        .getElementById(
            "doctorModalForm"
        )
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const form =
                    new FormData(
                        event.target
                    );


                state.doctors.push({

                    id: id(),

                    name:
                        form.get("name"),

                    specialization:
                        form.get(
                            "specialization"
                        ),

                    qualification:
                        form.get(
                            "qualification"
                        ),

                    phone:
                        form.get("phone"),

                    city:
                        form.get("city"),

                    available: true

                });


                saveState();

                closeModal();

                toast(
                    "Doctor added successfully."
                );

                renderApp("doctors");

            }
        );

}


/* =========================================================
   BLOOD REQUEST UPDATE
========================================================= */

function updateBloodRequest(
    requestId,
    status
) {

    const request =
        state.bloodRequests.find(
            item =>
                item.id === requestId
        );


    if (!request) {
        return;
    }


    request.status =
        status;


    saveState();


    toast(
        `Request ${status.toLowerCase()}.`
    );


    renderApp("requests");

}


/* =========================================================
   MARK NOTIFICATIONS READ
========================================================= */

function markAllNotificationsRead() {

    state.notifications.forEach(
        notification => {

            if (
                notification.role ===
                state.role
            ) {

                notification.read = true;

            }

        }
    );


    saveState();

    toast(
        "All notifications marked as read."
    );

    renderApp("notifications");

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
    title,
    body
) {

    document.getElementById(
        "modalRoot"
    ).innerHTML = `

        <div
            class="modal-backdrop"
            data-modal-backdrop
        >

            <div class="modal">

                <div class="modal-header">

                    <h2>
                        ${title}
                    </h2>

                    <button
                        class="modal-close"
                        data-close-modal
                        type="button"
                    >

                        <i class="fa-solid fa-xmark"></i>

                    </button>

                </div>


                <div class="modal-body">

                    ${body}

                </div>

            </div>

        </div>

    `;


    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    closeModal
                )
        );


    document
        .querySelector(
            "[data-modal-backdrop]"
        )
        .addEventListener(
            "click",
            event => {

                if (
                    event.target.hasAttribute(
                        "data-modal-backdrop"
                    )
                ) {

                    closeModal();

                }

            }
        );

}


function closeModal() {

    document.getElementById(
        "modalRoot"
    ).innerHTML = "";

}


/* =========================================================
   RESET DATA
========================================================= */

function resetData() {

    const confirmed =
        confirm(
            "This will delete all frontend data and restore the default state. Continue?"
        );


    if (!confirmed) {
        return;
    }


    state =
        structuredClone(
            defaultState
        );


    state.loggedIn = true;

    state.role =
        selectedRole;


    saveState();


    toast(
        "Frontend data has been reset."
    );


    navigate("dashboard");

}


/* =========================================================
   INITIAL APPLICATION
========================================================= */

/* =========================================================
   INITIAL APPLICATION
========================================================= */

async function init() {

    if (!state.loggedIn) {

        renderLogin();

        return;

    }


    /* -----------------------------------------
       Load logged-in user's latest data
       from MySQL before displaying the app.
    ----------------------------------------- */

    if (state.role === "user") {

        await loadUserProfileFromDatabase();

    }


    /* -----------------------------------------
       Continue normal application routing
    ----------------------------------------- */

    if (location.hash) {

        handleRoute();

    } else {

        navigate("dashboard");

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);