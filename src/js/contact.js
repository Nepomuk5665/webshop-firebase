const Contact = {
    init() {
        this.setupContactForm();
    },
    
    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        
        if (contactForm) {
            contactForm.addEventListener('submit', async e => {
                e.preventDefault();
                
                const nameInput = document.getElementById('contact-name');
                const emailInput = document.getElementById('contact-email');
                const subjectInput = document.getElementById('contact-subject');
                const messageInput = document.getElementById('contact-message');
                
                const formData = {
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    subject: subjectInput.value,
                    message: messageInput.value.trim()
                };
                
                if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                    this.showFormResponse('Please fill out all fields', false);
                    return;
                }
                
                try {
                    const result = await Database.submitContactForm(formData);
                    
                    if (result.success) {
                        this.showFormResponse('Your message has been sent successfully. We will get back to you soon!', true);
                        contactForm.reset();
                    } else {
                        this.showFormResponse('An error occurred while sending your message. Please try again.', false);
                    }
                } catch (error) {
                    console.error('Error submitting contact form:', error);
                    this.showFormResponse('An error occurred while sending your message. Please try again.', false);
                }
            });
        }
    },
    
    showFormResponse(message, isSuccess) {
        const responseElement = document.getElementById('contact-response');
        
        if (responseElement) {
            responseElement.textContent = message;
            responseElement.className = isSuccess ? 'success' : 'error';
            responseElement.classList.remove('hidden');
            
            setTimeout(() => {
                responseElement.classList.add('hidden');
            }, 5000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Contact.init();
});