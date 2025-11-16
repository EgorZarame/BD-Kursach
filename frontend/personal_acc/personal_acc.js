(function(){
  const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('ru-RU'); };
  const fmtMoney = (n) => (Number(n)||0).toLocaleString('ru-RU') + ' ₽';

  (async function(){
    const token = App.ensureAuthOrRedirect(); if(!token) return;
    const email = App.parseEmailFromToken(token);
    try{
      const res = await fetch('/api/my-bookings?email='+encodeURIComponent(email));
      const data = res.ok ? await res.json() : [];
      const wrap = document.getElementById('bookings-container');
      if(!data.length){ wrap.innerHTML = '<div class="no-results">Бронирований пока нет</div>'; return; }

      // Предзагрузка путей изображений для каждого бронирования
      const bookingsWithImages = await Promise.all(data.map(async (b) => {
        let imgSrc = '/frontend/personal_acc/image1.jpg';
        try{
          const r = await fetch(`/api/listings/${b.building_id}/images`);
          if(r.ok){
            const imgs = await r.json();
            if(Array.isArray(imgs) && imgs.length > 0 && imgs[0].file_path){
              imgSrc = imgs[0].file_path;
            }
          }
        }catch(_){}
        return { ...b, imgSrc };
      }));

      wrap.innerHTML = bookingsWithImages.map(b=>{
        const period = `${fmtDate(b.start_date)} — ${fmtDate(b.end_date)}`;
        const sum = fmtMoney(b.total_amount);
        return `
      <div class="booking_card">
        <img src="${b.imgSrc}" alt="Помещение" class="listing-image">
        <div class="booking-info">
          <p><strong>${b.type} — ${b.city}</strong></p>
          <p>${b.address}</p>
          <p>Период: ${period}</p>
          <p>Сумма: ${sum}</p>
        </div>
      </div>`;
      }).join('');
    }catch(e){ /* */ }
  })();
})();


