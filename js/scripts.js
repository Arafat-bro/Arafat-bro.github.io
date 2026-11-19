window.addEventListener('DOMContentLoaded', () => {

    // Load profile information from Pages CMS
    fetch('./content/profile.json', { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Profile request failed: ${response.status}`);
            }
            return response.json();
        })
        .then(profile => {

            const setText = (id, value) => {
                const element = document.getElementById(id);
                if (element && typeof value === 'string') {
                    element.textContent = value;
                }
            };

            const setLink = (id, value) => {
                const element = document.getElementById(id);
                if (!element) return;

                if (typeof value === 'string' && value.trim()) {
                    element.href = value;
                    element.hidden = false;
                } else {
                    element.hidden = true;
                }
            };

            setText('profileName', profile.display_name);
            setText('profileNavName', profile.display_name);
            setText('profileHeadline', profile.headline);
            setText('profileLocation', profile.location);
            setText('profileBio', profile.bio);

            const profileImage = document.getElementById('profileImage');
            if (profileImage && profile.profile_image) {
                profileImage.src = profile.profile_image;
                profileImage.alt = `Profile photo of ${profile.display_name || 'the site owner'}`;
            }

            setLink('profileLinkedIn', profile.linkedin);
            setLink('profileResearchGate', profile.researchgate);
            setLink('profileOrcid', profile.orcid);
            setLink('downloadCv', profile.cv_file);

            if (profile.display_name) {
                document.title = `${profile.display_name} | Academic Portfolio`;
            }
        })
        .catch(error => {
            console.error('Could not load CMS profile:', error);
        });

    // Bootstrap scroll navigation
    const sideNav = document.querySelector('#sideNav');

    if (sideNav && window.bootstrap?.ScrollSpy) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            rootMargin: '0px 0px -40%',
        });
    }

    // Close mobile navigation after selecting a section
    const navbarToggler = document.querySelector('.navbar-toggler');
    const responsiveNavItems = document.querySelectorAll('#navbarResponsive .nav-link');

    responsiveNavItems.forEach(item => {
        item.addEventListener('click', () => {
            if (
                navbarToggler &&
                window.getComputedStyle(navbarToggler).display !== 'none'
            ) {
                navbarToggler.click();
            }
        });
    });

    // Scroll to top button
    const goUpButton = document.getElementById('goUpButton');

    if (goUpButton) {
        const updateGoUpButton = () => {
            goUpButton.style.display =
                window.scrollY > 500 ? 'block' : 'none';
        };

        window.addEventListener('scroll', updateGoUpButton);

        goUpButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        updateGoUpButton();
    }
});
