// Ключ доступу Web3Forms (https://web3forms.com): створіть його для tg@vedis.com.ua і вставте сюди.
// Поки ключа немає, форми відкривають лист у поштовій програмі відвідувача.
const WEB3FORMS_KEY = '18800b6e-0caa-4d67-ad0e-0f1e2ac3611d';
const CONTACT_EMAIL = 'tg@vedis.com.ua';

document.documentElement.classList.add('js');

/* ---------- Мобільне меню ---------- */
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');
if (sidebar && menuToggle) {
  menuToggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', open);
    menuToggle.querySelector('span').textContent = open ? 'Закрити' : 'Меню';
  });
}

/* ---------- Рік у футері ---------- */
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------- Відправлення форм ---------- */
async function submitForm(form) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('[type="submit"]');
  const data = Object.fromEntries(new FormData(form));
  if (data.botcheck) return;
  const service = data.service ? ` — ${data.service}` : '';
  const subject = `${form.dataset.subject || 'Заявка з сайту'}${service}`;

  const lines = [
    ['Послуга', data.service], ['Ім’я', data.name], ['Компанія', data.company],
    ['Телефон / месенджер', data.phone], ['Email', data.email], ['Повідомлення', data.message],
  ].filter(([, v]) => v && String(v).trim()).map(([k, v]) => `${k}: ${String(v).trim()}`);

  if (!WEB3FORMS_KEY) {
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    return;
  }

  status.className = 'form-status';
  status.textContent = 'Надсилаємо…';
  button.disabled = true;
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject,
        from_name: 'Сайт vedis.com.ua',
        replyto: data.email || undefined,
        ...Object.fromEntries(lines.map((l) => { const i = l.indexOf(': '); return [l.slice(0, i), l.slice(i + 2)]; })),
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    form.reset();
    status.classList.add('is-ok');
    status.textContent = 'Дякую! Заявку отримано, я зв’яжуся з вами найближчим часом.';
  } catch (error) {
    status.classList.add('is-error');
    status.textContent = `Не вдалося надіслати. Напишіть, будь ласка, на ${CONTACT_EMAIL}.`;
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('form.js-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submitForm(form);
  });
});

/* ---------- Діалог «Замовити» ---------- */
const orderDialog = document.querySelector('#order-dialog');
if (orderDialog) {
  const serviceInput = orderDialog.querySelector('[name="service"]');
  const serviceName = orderDialog.querySelector('.service-name');
  const title = orderDialog.querySelector('h2');
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-order]');
    if (!trigger) return;
    event.preventDefault();
    serviceInput.value = trigger.dataset.order;
    serviceName.textContent = trigger.dataset.order;
    serviceName.hidden = !trigger.dataset.order;
    title.textContent = trigger.dataset.orderTitle || 'Замовити';
    const status = orderDialog.querySelector('.form-status');
    status.textContent = ''; status.className = 'form-status';
    orderDialog.showModal();
  });
  orderDialog.querySelector('.dialog-close').addEventListener('click', () => orderDialog.close());
  orderDialog.addEventListener('click', (event) => { if (event.target === orderDialog) orderDialog.close(); });
}

/* ---------- Тренінги: каталог → програма на всю ширину ---------- */
const programs = [...document.querySelectorAll('.program')];
if (programs.length) {
  const trainings = document.querySelector('.trainings');
  const pageHead = document.querySelector('.page-head');
  const links = [...document.querySelectorAll('.program-nav a')];
  const listTitle = document.title;
  const show = (id, scroll) => {
    const target = programs.find((p) => p.id === id) || null;
    programs.forEach((p) => p.classList.toggle('is-active', p === target));
    links.forEach((a) => a.setAttribute('aria-current', target && a.hash === `#${target.id}` ? 'true' : 'false'));
    trainings.classList.toggle('is-detail', !!target);
    if (pageHead) pageHead.hidden = !!target;
    document.title = target ? `${target.querySelector('h2').textContent} — тренінг | Ведіс` : listTitle;
    if (scroll) window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), !!location.hash);

  document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
}

/* ---------- Галерея фото ---------- */
const galleryLinks = [...document.querySelectorAll('.gallery a')];
if (galleryLinks.length) {
  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.innerHTML = `<div class="lightbox-inner"><img alt="" /><button class="lb-close" aria-label="Закрити">×</button>
    <button class="lb-prev" aria-label="Попереднє фото">‹</button><button class="lb-next" aria-label="Наступне фото">›</button>
    <div class="lb-count"></div></div>`;
  document.body.append(box);
  const img = box.querySelector('img');
  const count = box.querySelector('.lb-count');
  let group = []; let index = 0;
  const show = (i) => {
    index = (i + group.length) % group.length;
    img.src = group[index].href;
    img.alt = group[index].querySelector('img').alt;
    count.textContent = `${index + 1} / ${group.length}`;
  };
  galleryLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    group = [...link.closest('.gallery').querySelectorAll('a')];
    show(group.indexOf(link));
    box.showModal();
  }));
  box.querySelector('.lb-close').addEventListener('click', () => box.close());
  box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (event) => { if (event.target.classList.contains('lightbox-inner')) box.close(); });
  document.addEventListener('keydown', (event) => {
    if (!box.open) return;
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
}
