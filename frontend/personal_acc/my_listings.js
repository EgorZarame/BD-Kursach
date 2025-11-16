async function loadMyListings() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth';
        return [];
    }
    let email = '';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email;
    } catch (e) {
        window.location.href = '/auth';
        return [];
    }
    try {
        const res = await fetch(`/api/my-listings?email=${email}`);
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (e) {
        //
        return [];
    }
}

function translateType(code) {
    const map = { storage: 'Кладовка', office: 'Офис', retail: 'Торговое помещение', warehouse: 'Склад', garage: 'Гараж' };
    return map[code] || code;
}

function renderListings(listings) {
    const container = document.getElementById('listings-container');
    if (!listings || listings.length === 0) {
        container.innerHTML = '<div class="no-results">Объявлений пока нет</div>';
        return;
    }
    container.innerHTML = listings.map(listing => {
        const img = imagesMap[listing.id] || '/frontend/personal_acc/image1.jpg';
        const priceNum = parseInt(listing.price) || 0;
        const title = `${translateType(listing.type)} — ${listing.city}`;
        const description = listing.description || listing.comment || '';
        return `
        <div class="listing">
            <img src="${img}" alt="Фото помещения" class="listing-image">
            <div class="listing-content">
                <h3 class="listing-title">${title}</h3>
                <p class="listing-price">${priceNum.toLocaleString()} ₽/мес</p>
                <p class="listing-address">${listing.address}</p>
                ${description ? `<p class="listing-description"><strong>Описание:</strong> ${description}</p>` : ''}
                ${listing.user_comment ? `<p class="listing-user-comment"><strong>Комментарий:</strong> ${listing.user_comment}</p>` : ''}
                <div class="listing-actions">
                    <button class="btn btn-primary" data-id="${listing.id}">Редактировать</button>
                    <button class="btn btn-secondary" data-id="${listing.id}">Посмотреть объявление</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/auth'; return null; }
    try { return JSON.parse(atob(token.split('.')[1])).email; } catch (_) { localStorage.removeItem('token'); window.location.href = '/auth'; return null; }
}

function openAddModal() {
    document.getElementById('add-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAddModal() {
    document.getElementById('add-modal').style.display = 'none';
    document.body.style.overflow = '';
    document.getElementById('add-form')?.reset();
    const preview = document.getElementById('preview-image');
    if (preview) preview.src = '/frontend/personal_acc/download-icon.png';
}

async function reloadListings() {
    listingsData = await loadMyListings();
    renderListings(listingsData);
}

function setupAddModal() {
    const addModal = document.getElementById('add-modal');
    const openBtn = document.getElementById('open-add-modal');
    const closeBtn = document.getElementById('close-add-modal');
    const cancelBtn = document.getElementById('cancel-add');
    const addForm = document.getElementById('add-form');
    const imageInput = document.getElementById('image-upload');
    const preview = document.getElementById('preview-image');

    if (openBtn) openBtn.addEventListener('click', () => { if (checkAuth()) openAddModal(); });
    if (closeBtn) closeBtn.addEventListener('click', closeAddModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeAddModal);
    window.addEventListener('click', (e) => { if (e.target === addModal) closeAddModal(); });

    if (imageInput && preview) {
        preview.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', function() {
            const file = this.files && this.files[0];
            if (!file) return;
            const r = new FileReader();
            r.onload = (ev) => { preview.src = ev.target.result; };
            r.readAsDataURL(file);
        });
    }

    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userEmail = checkAuth();
            if (!userEmail) return;

            const formData = {
                type: document.getElementById('add-type').value,
                city: document.getElementById('add-city').value,
                address: document.getElementById('add-address').value,
                price: document.getElementById('add-price').value,
                description: (document.getElementById('add-description').value || '').trim(),
                user_comment: (document.getElementById('add-user_comment').value || '').trim(),
                user_email: userEmail
            };

            const descLen = formData.description.length;
            if (descLen < 10 || descLen > 100) {
                alert('Описание обязательно. Длина должна быть от 10 до 100 символов.');
                return;
            }

            const resp = await fetch('/api/add-listing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (!resp.ok) { alert('Ошибка создания: ' + (await resp.text())); return; }
            const { id } = await resp.json().catch(async () => ({ id: 0 }));

            const file = imageInput && imageInput.files ? imageInput.files[0] : null;
            if (id && file) {
                const fd = new FormData();
                fd.append('image', file);
                await fetch(`/api/listings/${id}/images`, {
                    method: 'POST',
                    body: fd,
                    credentials: 'include',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            }
            closeAddModal();
            await reloadListings();
            alert('Объявление добавлено');
        });
    }
}

let listingsData = [];
let imagesMap = {};

function openEditModal(listing) {
    document.getElementById('edit-type').value = listing.type;
    document.getElementById('edit-city').value = listing.city;
    document.getElementById('edit-address').value = listing.address;
    document.getElementById('edit-price').value = parseInt(listing.price) || 0;
    document.getElementById('edit-form').dataset.listingId = listing.id;
    document.getElementById('edit-modal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function setupEditForm() {
    const form = document.getElementById('edit-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(form.dataset.listingId);
        const listingIndex = listingsData.findIndex(l => l.id === id);
        if (listingIndex === -1) return;
        listingsData[listingIndex] = {
            ...listingsData[listingIndex],
            type: document.getElementById('edit-type').value,
            city: document.getElementById('edit-city').value,
            address: document.getElementById('edit-address').value,
            price: String(parseInt(document.getElementById('edit-price').value) || 0),
        };
        renderListings(listingsData);
        closeEditModal();
        alert('Объявление успешно обновлено!');
    });

    // Удаление объявления
    const deleteBtn = document.getElementById('delete-listing');
    const deleteModal = document.getElementById('delete-modal');
    const deleteClose = document.getElementById('delete-close');
    const cancelDelete = document.getElementById('cancel-delete');
    const confirmDelete = document.getElementById('confirm-delete');

    const openDeleteModal = () => { deleteModal.style.display = 'block'; };
    const closeDeleteModal = () => { deleteModal.style.display = 'none'; };

    deleteBtn.addEventListener('click', () => {
        openDeleteModal();
    });
    deleteClose.addEventListener('click', closeDeleteModal);
    cancelDelete.addEventListener('click', closeDeleteModal);
    window.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

    confirmDelete.addEventListener('click', async function () {
        const id = parseInt(form.dataset.listingId);
        if (!id) return;
        try {
            const resp = await fetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!resp.ok) {
                const t = await resp.text();
                alert('Ошибка удаления: ' + t);
                return;
            }
            listingsData = listingsData.filter(l => l.id !== id);
            renderListings(listingsData);
            closeDeleteModal();
            closeEditModal();
        } catch (err) {
            //
            alert('Ошибка сети при удалении');
        }
    });
}

let viewModalLoaded = false;
async function openViewModal(listing) {
    if (!viewModalLoaded) {
        try {
            const response = await fetch('/frontend/personal_acc/view-modal.html');
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
            viewModalLoaded = true;
        } catch (error) {
            //
            alert('Не удалось загрузить окно просмотра.');
            return;
        }
    }
    document.getElementById('modal-type').textContent = translateType(listing.type);
    document.getElementById('modal-city').textContent = listing.city;
    document.getElementById('modal-address').textContent = listing.address;
    document.getElementById('modal-price').textContent = (parseInt(listing.price)||0).toLocaleString();
    document.getElementById('modal-description').textContent = listing.description || listing.comment || '';
    document.getElementById('modal-user-comment').textContent = listing.user_comment || '';
    document.getElementById('modal-image').src = imagesMap[listing.id] || '/frontend/personal_acc/image1.jpg';
    const vm = document.getElementById('view-modal');
    vm.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setupViewModalClose();
}

function setupViewModalClose() {
    const modal = document.getElementById('view-modal');
    if (!modal.dataset.initialized) {
        modal.querySelector('.close')?.addEventListener('click', () => { modal.style.display = 'none'; document.body.style.overflow=''; });
        window.addEventListener('click', (e) => { if (e.target === modal) { modal.style.display = 'none'; document.body.style.overflow=''; } });
        modal.dataset.initialized = 'true';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    listingsData = await loadMyListings();
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
    renderListings(listingsData);

    document.addEventListener('click', (e) => {
        const btn = e.target;
        if (btn.classList.contains('btn') && btn.textContent === 'Редактировать') {
            const id = parseInt(btn.dataset.id);
            const listing = listingsData.find(l => l.id === id);
            if (listing) openEditModal(listing);
        }
        if (btn.classList.contains('btn') && btn.textContent === 'Посмотреть объявление') {
            const id = parseInt(btn.dataset.id);
            const listing = listingsData.find(l => l.id === id);
            if (listing) openViewModal(listing);
        }
    });

    document.querySelector('#edit-modal .close')?.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => { const modal = document.getElementById('edit-modal'); if (e.target === modal) closeEditModal(); });
    setupEditForm();
    setupAddModal();
});
