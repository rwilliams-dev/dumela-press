// Contact form submission
document.getElementById("contactForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();
    const statusElement = document.getElementById("form-status");
    
    // Validate fields
    if (!name || !email || !subject || !message) {
        statusElement.textContent = "Please fill in all fields.";
        statusElement.style.color = "red";
        return;
    }
    
    // Send via EmailJS
    emailjs.send("service_9cd9884", "template_252kzzv", {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message
    })
    .then(response => {
        console.log("Email sent successfully!", response);
        statusElement.textContent = "Message sent successfully! I'll get back to you soon.";
        statusElement.style.color = "green";
        document.getElementById("contactForm").reset();
    })
    .catch(error => {
        console.error("Email send failed:", error);
        statusElement.textContent = "Failed to send message. Please try again.";
        statusElement.style.color = "red";
    });
});