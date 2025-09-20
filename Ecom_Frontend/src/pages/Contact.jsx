import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";
const API_SERVER =
  import.meta.env.VITE_API_SERVER?.replace(/\/+$/, "") ||
  API_URL.replace(/\/api$/, "") ||
  "";

// set axios defaults so we can use relative paths below
axios.defaults.baseURL = API_URL || undefined;
axios.defaults.headers.post["Content-Type"] = "application/json";
// ensure cookies (sessionid / csrftoken) are sent with requests
axios.defaults.withCredentials = true;

const fixUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (!API_SERVER) return url;
  return `${API_SERVER.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
};

// helper to read a cookie value (csrftoken)
function getCookie(name) {
  const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return match ? match.pop() : "";
}

function Modal({ title, message, onClose, type = "info" }) {
  const okRef = useRef(null);

  useEffect(() => {
    if (okRef.current) okRef.current.focus();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
        <h2
          className={`text-xl font-bold mb-4 ${
            type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {title}
        </h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          ref={okRef}
          onClick={onClose}
          className="px-6 py-2 bg-[#2F4F4F] text-white rounded-md hover:bg-[#2F4F4F]/80"
        >
          OK
        </button>
      </div>
    </div>
  );
}

const ContactPage = () => {
  const [contactData, setContactData] = useState({
    title: "Contact Us",
    description: "",
    image: null,
    form_title: "Enquiry Form",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modal, setModal] = useState({ show: false, title: "", message: "", type: "info" });

  useEffect(() => {
    // ensure CSRF cookie is set for subsequent POSTs
    axios.get("/csrf/").catch(() => {
      // ignore - backend may already set cookie via other endpoints
    });

    axios
      .get("/contacts/")
      .then((response) => {
        const results = response.data?.results?.[0] || response.data;
        setContactData(results || {});
      })
      .catch((error) => console.error("Error fetching contact data:", error));
  }, []);

  // auto-close success modal after 4s
  useEffect(() => {
    let t;
    if (modal.show && modal.type === "success") {
      t = setTimeout(() => setModal((m) => ({ ...m, show: false })), 4000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [modal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { name, email, phone, message } = formData;

    if (!name.trim()) {
      setModal({ show: true, title: "Validation Error", message: "Name is required.", type: "error" });
      return false;
    }
    if (name.length < 3) {
      setModal({ show: true, title: "Validation Error", message: "Name must be at least 3 characters long.", type: "error" });
      return false;
    }
    if (!/^[A-Za-z\s]+$/.test(name)) {
      setModal({ show: true, title: "Validation Error", message: "Name must contain only letters and spaces.", type: "error" });
      return false;
    }

    if (!email) {
      setModal({ show: true, title: "Validation Error", message: "Email is required.", type: "error" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setModal({ show: true, title: "Validation Error", message: "Please enter a valid email address.", type: "error" });
      return false;
    }

    if (!phone) {
      setModal({ show: true, title: "Validation Error", message: "Phone number is required.", type: "error" });
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      setModal({ show: true, title: "Validation Error", message: "Phone number must be exactly 10 digits.", type: "error" });
      return false;
    }

    if (!message.trim()) {
      setModal({ show: true, title: "Validation Error", message: "Message is required.", type: "error" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const csrftoken = getCookie("csrftoken");
      const res = await axios.post("/submissions/", formData, {
        headers: {
          "X-CSRFToken": csrftoken,
        },
      });

      const successMsg =
        res?.data?.message ||
        `Thank you for reaching us, ${formData.name}. We will contact you at ${formData.email}`;

      setModal({
        show: true,
        title: "Success",
        message: successMsg,
        type: "success",
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Submission error:", error);
      const serverMsg =
        error?.response?.data?.detail ||
        (error?.response?.data && JSON.stringify(error.response.data)) ||
        "There was an error sending your message. Please try again.";
      setModal({
        show: true,
        title: "Error",
        message: serverMsg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDescription = () => {
    const desc = contactData.description || "";
    return desc.replace(/\r\n/g, "\n").split("\n").map((line, idx) => {
      if (line.startsWith("## ")) return <h3 key={idx} className="text-xl font-semibold mt-6 mb-2">{line.slice(3)}</h3>;
      if (line.trim() === "") return <br key={idx} />;
      return <p key={idx} className="mb-2">{line.trim()}</p>;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8  space-y-4">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-full md:w-2/5">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-black">
            {contactData.title}
          </h1>
          <h2 className='text-2xl mb-4 text-gray-800'>For Online Order</h2>
          <div className="text-black">{renderDescription()}</div>
        </div>

        <div className="w-full md:w-3/5 flex justify-center md:justify-end items-start">
          {contactData.image && (
            <img
              src={fixUrl(contactData.image)}
              alt="Contact"
              className="w-full max-w-xs sm:max-w-sm md:max-w-3xl rounded-lg shadow-md object-cover"
            />
          )}
        </div>
      </div>

      <div className="border-t border-black my-8"></div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-bold lg:mx-52 text-start mb-8 text-gray-800">
          {contactData.form_title}
        </h2>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <fieldset disabled={isSubmitting} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 font-bold mb-2">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-gray-700 font-bold mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="text-start">
              <button
                type="submit"
                className="bg-[#2F4F4F] cursor-pointer text-white px-6 py-3 rounded-md hover:bg-[#2F4F4F]/80 transition duration-200 font-medium disabled:bg-gray-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>

      {modal.show && (
        <Modal
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ ...modal, show: false })}
        />
      )}
    </div>
  );
};

export default ContactPage;
