(() => {
  const model = (new URLSearchParams(location.search).get('model') || '').toUpperCase();
  const galleryCounts = {'FK-027':2,'FK-028':3,'FK-029':2,'FK-030':2,'FK-031':3,'FK-032':2};
  const count = galleryCounts[model] || 1;
  const thumbs = document.querySelector('.thumbs');
  const main = document.getElementById('product-image');
  if (!thumbs || !main || count === 1) return;
  thumbs.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const src = `gorseller/${model}${i === 1 ? '' : `-${i}`}.jpg`;
    const button = document.createElement('button');
    button.className = `thumb block ${i === 1 ? 'is-active' : ''}`;
    button.type = 'button';
    button.setAttribute('aria-label', `${model} görsel ${i}`);
    button.innerHTML = `<img src="${src}" class="w-full aspect-square object-cover" alt="${model} ürün görünümü ${i}">`;
    button.addEventListener('click', () => {
      main.src = src;
      main.alt = `${model} ürün görünümü ${i}`;
      thumbs.querySelectorAll('.thumb').forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');
    });
    thumbs.appendChild(button);
  }
})();