window.addEventListener('DOMContentLoaded', () => {
    const get = async name => {
        const r = await fetch(`./content/${name}.json`, {cache: 'no-cache'});
        if (!r.ok) throw Error(`${name}.json: HTTP ${r.status}`);
        return r.json();
    };

    const el = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null) n.textContent = String(text);
        return n;
    };

    const load = (name, callback) =>
        get(name).then(callback).catch(e => console.error(e));

    // Render multiline CMS text as paragraphs and semantic lists.
    const appendFormatted = (parent, value) => {
        if (typeof value !== 'string' || !value.trim()) return;

        let html = value;

        // Decode HTML tags escaped by the CMS.
        for (let i = 0; i < 2 && /&lt;\/?[a-z][^&]*&gt;/i.test(html); i++) {
            html = new DOMParser().parseFromString(html, 'text/html').body.textContent;
        }

        const parsed = new DOMParser().parseFromString(html, 'text/html');

        const allowed = new Set([
            'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U',
            'S', 'DEL', 'INS', 'SUB', 'SUP',
            'UL', 'OL', 'LI', 'BLOCKQUOTE',
            'CODE', 'PRE', 'A',
            'H2', 'H3', 'H4', 'H5', 'H6'
        ]);

        const blocked = new Set([
            'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT',
            'EMBED', 'SVG', 'MATH', 'FORM'
        ]);

        const copyNode = (source, destination) => {
            if (source.nodeType === Node.TEXT_NODE) {
                const lines = source.textContent.split(/\r?\n/);
                lines.forEach((line, index) => {
                    if (line) destination.append(document.createTextNode(line));
                    if (index < lines.length - 1) {
                        destination.append(document.createElement('br'));
                    }
                });
                return;
            }

            if (source.nodeType !== Node.ELEMENT_NODE) return;

            const tag = source.tagName;
            if (blocked.has(tag)) return;

            const target = allowed.has(tag)
                ? document.createElement(tag.toLowerCase())
                : destination;

            if (tag === 'A' && allowed.has(tag)) {
                const href = source.getAttribute('href') || '';
                try {
                    const url = new URL(href, document.baseURI);
                    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
                        target.setAttribute('href', href);
                        target.setAttribute('target', '_blank');
                        target.setAttribute('rel', 'noopener noreferrer');
                    }
                } catch (_) {}
            }

            if (target !== destination) destination.append(target);

            Array.from(source.childNodes).forEach(child => {
                copyNode(child, target);
            });
        };

        Array.from(parsed.body.childNodes).forEach(node => {
            copyNode(node, parent);
        });
    };

    const validUrl = value => {
        try {
            const u = new URL(value);
            return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
        } catch { return ''; }
    };

    // Profile
    load('profile', profile => {
        const text = (id, value) => {
            const n = document.getElementById(id);
            if (n && typeof value === 'string') n.textContent = value;
        };
        const link = (id, value) => {
            const n = document.getElementById(id);
            if (!n) return;
            const href = validUrl(value || '');
            if (href) { n.href = href; n.hidden = false; }
            else n.hidden = true;
        };

        text('profileName', profile.display_name);
        text('profileNavName', profile.display_name);
        text('profileHeadline', profile.headline);
        text('profileLocation', profile.location);
        const bio = document.getElementById('profileBio');
        if (bio) {
            bio.replaceChildren();
            appendFormatted(bio, profile.bio);
        }

        const image = document.getElementById('profileImage');
        if (image && profile.profile_image) {
            image.src = profile.profile_image;
            image.alt = `Profile photo of ${profile.display_name || 'site owner'}`;
        }

        link('profileLinkedIn', profile.linkedin);
        link('profileResearchGate', profile.researchgate);
        link('profileOrcid', profile.orcid);

        const cv = document.getElementById('downloadCv');
        if (cv && profile.cv_file) cv.href = profile.cv_file;

        if (profile.display_name)
            document.title = `${profile.display_name} | Academic Portfolio`;
    });

    // Experience
    load('experience', items => {
        const target = document.getElementById('experienceList');
        if (!target) return;
        target.replaceChildren();

        items.forEach((x, i) => {
            const row = el('div',
                `d-flex flex-column flex-md-row justify-content-between${i < items.length - 1 ? ' mb-5' : ''}`);
            const main = el('div', 'flex-grow-1');
            main.append(el('h3', 'mb-0', x.position));

            const heading = el('div', 'subheading lh-sm mb-3');
            heading.append(document.createTextNode(x.department || ''));
            if (x.department && x.organization)
                heading.append(document.createElement('br'));
            if (x.organization)
                heading.append(document.createTextNode(x.organization));

            main.append(heading);
            appendFormatted(main, x.description);
            const dates = `${x.start_date || ''}${x.start_date && x.end_date ? ' to ' : ''}${x.end_date || ''}`;
            const dateBox = el('div', 'flex-shrink-0');
            dateBox.append(el('span', 'text-primary', dates));
            row.append(main, dateBox);
            target.append(row);
        });
    });

    // Education
    load('education', items => {
        const target = document.getElementById('educationList');
        if (!target) return;
        target.replaceChildren();

        items.forEach((x, i) => {
            const row = el('div',
                `d-flex flex-column flex-md-row justify-content-between${i < items.length - 1 ? ' mb-5' : ''}`);
            const main = el('div', 'flex-grow-1');
            main.append(
                el('h3', 'mb-0', x.institution),
                el('div', 'subheading mb-3', x.degree)
            );
            if (x.department) main.append(el('div', '', x.department));
            if (x.grade) main.append(el('p', 'mb-1', x.grade));
            if (x.status) main.append(el('p', 'mb-1', x.status));
            appendFormatted(main, x.description);

            const dates = `${x.start_date || ''}${x.start_date && x.end_date ? ' to ' : ''}${x.end_date || ''}`;
            const dateBox = el('div', 'flex-shrink-0');
            dateBox.append(el('span', 'text-primary', dates));
            row.append(main, dateBox);
            target.append(row);
        });
    });

    // Skills
    load('skills', groups => {
        const target = document.getElementById('skillsContent');
        if (!target) return;
        target.replaceChildren();

        const icons = {
            'Microsoft Word': 'word.png',
            'Microsoft Excel': 'excel.png',
            'Microsoft PowerPoint': 'power.png',
            'Canva': 'canva.png',
            'R': 'r.png'
        };

        groups.forEach(group => {
            target.append(el('div', 'subheading mb-3', group.category));

            if (group.category === 'Software Proficiency') {
                const list = el('ul', 'list-inline dev-icons mb-5');
                (group.items || []).forEach(label => {
                    const li = el('li', 'list-inline-item');
                    if (icons[label]) {
                        const img = el('img', 'img-fluid mx-auto mb-2');
                        img.src = `assets/img/${icons[label]}`;
                        img.alt = label;
                        img.title = label;
                        li.append(img);
                    } else li.append(el('span', 'small', label));
                    list.append(li);
                });
                target.append(list);
            } else {
                const list = el('ul', 'fa-ul mb-5');
                (group.items || []).forEach(label => {
                    const li = el('li');
                    li.append(el('i', 'fa-solid fa-check'));
                    li.append(document.createTextNode(` ${label}`));
                    list.append(li);
                });
                target.append(list);
            }
        });
    });

    // Publications
    load('publications', items => {
        const target = document.getElementById('publicationsList');
        if (!target) return;
        target.replaceChildren();

        items.forEach((x, i) => {
            const title = el('li');
            title.append(document.createTextNode(`${i + 1}. `));

            const href = validUrl(x.url || '');
            if (href) {
                const a = el('a', '', x.title);
                a.href = href;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                title.append(a);
            } else title.append(document.createTextNode(x.title || ''));
            target.append(title);

            const metadata = [x.journal, x.year, x.status].filter(Boolean).join(' | ');
            if (metadata) target.append(el('li', '', metadata));

            if (x.doi) {
                const li = el('li');
                const a = el('a', '', `DOI: ${x.doi}`);
                a.href = `https://doi.org/${encodeURIComponent(x.doi)}`;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                li.append(a);
                target.append(li);
            }

            if (x.description) {
                const description = el('li', 'mb-3');
                appendFormatted(description, x.description);
                target.append(description);
            }
        });
    });

    // Interests and hobbies
    ['interests', 'hobbies'].forEach(name => {
        load(name, data => {
            const target = document.getElementById(`${name}Content`);
            if (!target) return;
            target.replaceChildren();
            (data.paragraphs || []).forEach(paragraph => {
                appendFormatted(target, paragraph);
            });
        });
    });

    // Awards
    load('awards', items => {
        const target = document.getElementById('awardsList');
        if (!target) return;
        target.replaceChildren();

        items.forEach(x => {
            const li = el('li');
            const marker = el('span', 'fa-li');
            marker.append(el('i', 'fas fa-trophy text-warning'));
            const details = el('span');
            details.textContent = [
                x.title,
                x.issuer ? `, ${x.issuer}` : '',
                x.date ? ` (${x.date})` : ''
            ].join('');
            li.append(marker, details);
            if (x.description) appendFormatted(li, x.description);
            target.append(li);
        });
    });

    // Extracurricular activities
    load('extra', items => {
        const target = document.getElementById('extraList');
        if (!target) return;
        target.replaceChildren();

        items.forEach(x => {
            const li = el('li', 'mb-3');
            if (x.image) {
                const img = el('img', 'img-fluid mx-auto mb-1');
                img.src = x.image;
                img.alt = x.title || 'Activity image';
                li.append(img, document.createTextNode(' '));
            }
            li.append(document.createTextNode(
                `${x.title || ''}${x.period ? ` (${x.period})` : ''}`
            ));
            target.append(li);
        });
    });

    // Existing navigation behaviour
    const sideNav = document.querySelector('#sideNav');
    if (sideNav && window.bootstrap?.ScrollSpy) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            rootMargin: '0px 0px -40%'
        });
    }

    const toggler = document.querySelector('.navbar-toggler');
    document.querySelectorAll('#navbarResponsive .nav-link').forEach(item => {
        item.addEventListener('click', () => {
            if (toggler && getComputedStyle(toggler).display !== 'none')
                toggler.click();
        });
    });

    const goUp = document.getElementById('goUpButton');
    if (goUp) {
        const update = () => {
            goUp.style.display = window.scrollY > 500 ? 'block' : 'none';
        };
        window.addEventListener('scroll', update);
        goUp.addEventListener('click', () =>
            window.scrollTo({top: 0, behavior: 'smooth'})
        );
        update();
    }
});
