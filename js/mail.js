// Initialize EmailJS
(function() {
    emailjs.init("2F7ndgYneXaVmS_4T"); // Replace with your actual EmailJS user ID
})();

function submitForm(event) {
    event.preventDefault(); // Prevent the default form submission

    // Disable the submit button to prevent multiple submissions
    const sendButton = document.getElementById("send-button");
    sendButton.disabled = true;
    sendButton.value = "Sending..."; // Change button text for feedback


    // Collect form data
    const serviceID = 'service_oxzqwpa';
    const templateID = 'template_nrda90g';

    const templateParams = {
        to_name: "Umar Razzaq",
        from_name: document.getElementById("fname").value + document.getElementById("lname").value,
        sender_email: document.getElementById("email").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value,
    };

    emailjs.send(serviceID, templateID, templateParams)
        .then(response => {
            alert("Email sent successfully!");
            document.getElementById("contact-form").reset();
            sendButton.disabled = false;
            sendButton.value = "Send Message";
        })
        .catch(error => {
            alert("Failed to send the email. Please try again later.");
            console.error("EmailJS Error:", error);
            sendButton.disabled = false;
            sendButton.value = "Send Message";
        });
}

// Attach the submit event listener to the form
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contact-form");
    form.addEventListener("submit", submitForm);
});
