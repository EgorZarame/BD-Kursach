document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem("token");
    let userEmail = '';

    if (!token) {
        alert("Вы не авторизованы");
        window.location.href = "/auth";
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userEmail = payload.email;

        const userNav = document.querySelector(".user-nav");
        if (userNav) {
            const emailTag = document.createElement("div");
            emailTag.textContent = `Вы вошли как: ${userEmail}`;
            emailTag.style.marginLeft = "auto";
            emailTag.style.fontWeight = "bold";
            userNav.appendChild(emailTag);
        }

        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("token");
                window.location.href = "/authorization/authorization.html";
            });
        }
    } catch (e) {
        alert("Ошибка токена. Войдите заново.");
        localStorage.removeItem("token");
        window.location.href = "/auth";
        return;
    }

    let listingsData = [];
    let imagesMap = {};
    try {
        const res = await fetch('/api/listings');
        if (res.ok) {
            listingsData = await res.json();
        } else {
            //
        }
    } catch (e) {
        //
    }

    try {
        await Promise.all((listingsData || []).map(async (l) => {
            try {
                const r = await fetch(`/api/listings/${l.id}/images`);
                if (r.ok) {
                    const imgs = await r.json();
                    if (Array.isArray(imgs) && imgs.length > 0 && imgs[0].file_path) {
                        imagesMap[l.id] = imgs[0].file_path;
                    }
                }
            } catch (_) {}
        }));
    } catch (_) {}

    const getTypeName = (code) => ({
        storage: 'Кладовка',
        office: 'Офис',
        warehouse: 'Склад',
        garage: 'Гараж'
    }[code] || code);

    const getCityName = (codeOrRu) => {
        const map = { ufa: 'Уфа', moscow: 'Москва', spb: 'Санкт-Петербург' };
        if (map[codeOrRu]) return map[codeOrRu];
        return codeOrRu;
    };

    const normalizeCityCode = (val) => {
        const v = (val || '').toString().toLowerCase();
        if (v === 'уфа') return 'ufa';
        if (v === 'москва') return 'moscow';
        if (v.includes('петербург') || v === 'спб') return 'spb';
        return v;
    };

    const normalizeTypeCode = (val) => {
        const v = (val || '').toString().toLowerCase();
        if (v.includes('кладов')) return 'storage';
        if (v === 'office' || v.includes('офис')) return 'office';
        // retail отсутствует в системе
        if (v.includes('склад')) return 'warehouse';
        if (v.includes('гараж')) return 'garage';
        return v; // если уже код
    };

    renderListings(listingsData);


    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const filter = this.closest('.filter');
            const isActive = filter.classList.contains('active');
            document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
            if (!isActive) filter.classList.add('active');
        });
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter') && !e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
        }
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });
    }

    let currentListingId = null;

    const bookingForm = document.querySelector('.booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const start = document.getElementById('start-date').value;
            const end = document.getElementById('end-date').value;
            if (!currentListingId || !start || !end) {
                alert('Укажите даты');
                return;
            }
            try {
                const resp = await fetch('/api/rent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        building_id: currentListingId,
                        start_date: start,
                        end_date: end,
                        email: userEmail
                    })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    alert('Бронирование создано. Сумма: ' + (data.total_amount || 0));
                    document.getElementById('modal').style.display = 'none';
                } else {
                    const txt = await resp.text();
                    alert('Ошибка бронирования: ' + txt);
                }
            } catch (err) {
                console.error('Ошибка бронирования', err);
                alert('Ошибка сети');
            }
        });
    }

    async function applyFilters() {
        const priceMin = parseInt(document.getElementById('price-min').value) || 0;
        const priceMax = parseInt(document.getElementById('price-max').value) || 999999;
        const type = (document.getElementById('type').value || '').trim();
        const city = (document.getElementById('city').value || '').trim();
        const dateFrom = (document.getElementById('date-from')?.value || '').trim();
        const dateTo = (document.getElementById('date-to')?.value || '').trim();

        const baseMatch = (listing) => {
            const priceNum = parseInt(listing.price) || 0;
            const priceOk = priceNum >= priceMin && priceNum <= priceMax;
            const listingTypeCode = normalizeTypeCode(listing.type || listing.name || '');
            const typeOk = !type || listingTypeCode === type;
            const cityOk = !city || normalizeCityCode(listing.city) === city;
            return priceOk && typeOk && cityOk;
        };

        let result = [];
        if (dateFrom && dateTo) {
            try {
                const res = await fetch(`/api/listings/available?from=${dateFrom}&to=${dateTo}`);
                if (res.ok) {
                    const availableListings = await res.json();
                    result = (availableListings || []).filter(baseMatch);
                } else {
                    result = [];
                }
            } catch (_) {
                result = [];
            }
        } else {
            // Без дат фильтруем локально
            result = listingsData.filter(baseMatch);
        }

        renderListings(result);
        document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
    }
    window.applyFilters = applyFilters;

    document.getElementById('reset-filters').addEventListener('click', function() {
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';
        document.getElementById('type').value = '';
        document.getElementById('city').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        renderListings(listingsData);
        document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
    });

    function openModalFor(listing) {
        if (!listing) return;
        currentListingId = listing.id;
        const title = `${getTypeName(listing.type)} — ${getCityName(listing.city)}`;
        const priceNum = parseInt(listing.price) || 0;
        const img = imagesMap[listing.id] || '/frontend/public/image1.jpg';
        const modal = document.getElementById('modal');
        const titleEl = document.querySelector('.modal-title');
        const priceEl = document.querySelector('.modal-price');
        const descriptionEl = document.querySelector('.modal-description');
        const commentEl = document.querySelector('.modal-comment');
        const cityEl = document.querySelector('.modal-city');
        const addrEl = document.querySelector('.modal-address');
        const imgEl = document.querySelector('.modal-image');
        if (titleEl) titleEl.textContent = title;
        if (priceEl) priceEl.textContent = `${priceNum.toLocaleString()} ₽/мес`;
        if (descriptionEl) descriptionEl.textContent = listing.description || listing.comment || '';
        if (commentEl) commentEl.textContent = listing.user_comment || '';
        if (cityEl) cityEl.textContent = `Город: ${getCityName(listing.city)}`;
        if (addrEl) addrEl.textContent = `Адрес: ${listing.address}`;
        if (imgEl) imgEl.src = img;
        if (modal) modal.style.display = 'flex';
    }

    function renderListings(listings) {
        const container = document.getElementById('listings-container');
        const noresults = document.querySelector('.no-results');

        if (!listings || listings.length === 0) {
            noresults.style.display = 'block';
            return;
        }
        container.innerHTML = listings.map(listing => {
            const title = `${getTypeName(listing.type)} — ${getCityName(listing.city)}`;
            const priceNum = parseInt(listing.price) || 0;
            const img = imagesMap[listing.id] || '/frontend/public/image1.jpg';
            const description = listing.description || listing.comment || '';
            return `
        <div class="listing">
            <img src="${img}" alt="Фото помещения" class="listing-image">
            <div class="listing-content">
                <h3 class="listing-title">${title}</h3>
                <p class="listing-price">${priceNum.toLocaleString()} ₽/мес</p>
                <p class="listing-address">${listing.address}</p>
                ${description ? `<p class="listing-description">${description}</p>` : ''}
                <div class="listing-actions">
                    <button class="btn btn-primary" data-id="${listing.id}">Забронировать</button>
                    <button class="btn btn-secondary" data-id="${listing.id}">Просмотреть</button>
                </div>
            </div>
        </div>`;
        }).join('');

        document.querySelectorAll('.btn-secondary[data-id]').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.getAttribute('data-id'));
                const listing = listingsData.find(item => item.id === id);
                openModalFor(listing);
            });
        });
        document.querySelectorAll('.btn-primary[data-id]').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.getAttribute('data-id'));
                const listing = listingsData.find(item => item.id === id);
                openModalFor(listing);
            });
        });
    }

    // FAQ аккордионы
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement;
            const openItem = document.querySelector('.accordion-item.active');

            if (openItem && openItem !== item) {
                openItem.classList.remove('active');
            }
            item.classList.toggle('active');
        });
    });

});