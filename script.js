/* script.js - gestion produits, personnalisation, packaging & panier */
const WHATSAPP_PHONE = "212668801983"; // ton numéro
const STORE_EMAIL = "parfulys@gmail.com";

/* ===== DATA ===== */
const PRODUCTS = [
  {id:101, name:"pots 40g", price:49, img:"images/bougie1.jpg", desc:"Bougie délicate, parfum léger."},
  {id:102, name:"ours", price:49, img:"images/bougie2.jpg", desc:"Parfum boisé et doux."},
  {id:103, name:"cube", price:39, img:"images/bougie3.jpg", desc:"Arôme apaisant et chaud."}
];

const PACKS = [
  {id:104, name:"Pack 3 produits", price:75, img:"images/bougie1.jpg", desc:"pots de 40g + ours + cub (parfum et couleur de votre choix)"},
  {id:105, name:"Pack 4 produits", price:89, img:"images/bougie2.jpg", desc:"4 produits + parfum et couleur de votre choix"},
  {id:106, name:"Pack 5 produits", price:119, img:"images/bougie3.jpg", desc:"6 produits + parfum et couleur de votre choix"}
];

/* ===== localStorage helpers ===== */
const STORAGE_KEY = "ldambre_cart_v4";
const PACKING_KEY = "ldambre_pack_choice_v4";

function readCart(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }catch(e){return[]} }
function saveCart(c){ localStorage.setItem(STORAGE_KEY, JSON.stringify(c)) }
function setPackagingChoice(obj){ localStorage.setItem(PACKING_KEY, JSON.stringify(obj)) }
function getPackagingChoice(){ try{ return JSON.parse(localStorage.getItem(PACKING_KEY))||null }catch(e){return null} }
function clearPackagingChoice(){ localStorage.removeItem(PACKING_KEY) }

function formatMAD(n){ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'MAD'}).format(n) }

/* ===== REDUCTIONS PAR QUANTITE ===== */
function getDiscountRate(totalQty){
  if(totalQty >= 4) return 0.40;
  if(totalQty === 3) return 0.35;
  if(totalQty === 2) return 0.30;
  return 0;
}

/* ===== Frais de livraison ===== */
function getDeliveryFee() {
  const deliveryRegion = document.getElementById('deliveryRegion');
  const deliveryFeeInput = document.getElementById('deliveryFee');

  if(!deliveryRegion || !deliveryFeeInput) return 0;

  let fee = 0;
  if (deliveryRegion.value === "Rabat - Salé - Témara") fee = 0;
  else if (deliveryRegion.value === "Autres régions") fee = 15;

  deliveryFeeInput.value = fee === 0 ? "Gratuit" : fee + " DH";
  return fee;
}



const regionSelect = document.getElementById('deliveryRegion').addEventListener('change', () => {
  getDeliveryFee();
  renderCart('#cartRoot');
});





/* ===== Products standard ===== */
function renderProducts(selector){
  const root = document.querySelector(selector);
  if(!root) return;
  root.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `
      <img src="${p.img}" alt="${p.name}" onerror="this.src='images/placeholder.png'"/>
      <h4>${p.name}</h4>
      <div class="price">${formatMAD(p.price)}</div>
      <p style="color:#8b6f73">${p.desc}</p>
      <div class="controls">
        <div class="qty-wrap">
          <button class="dec">−</button>
          <input type="number" min="1" value="1" class="qty-input" />
          <button class="inc">+</button>
        </div>
        <button class="btn add-btn">Ajouter au panier</button>
      </div>
    `;
    root.appendChild(el);

    const dec = el.querySelector('.dec'), inc = el.querySelector('.inc'), qInput = el.querySelector('.qty-input');
    dec.addEventListener('click', ()=> qInput.value = Math.max(1, parseInt(qInput.value||1)-1));
    inc.addEventListener('click', ()=> qInput.value = Math.min(999, parseInt(qInput.value||1)+1));
    el.querySelector('.add-btn').addEventListener('click', ()=>{
      const qty = Math.max(1, parseInt(qInput.value||1));
      addToCartStandard(p.id, qty);
      showToast(`${qty} × ${p.name} ajouté au panier`);
      renderCart('#cartRoot');
      updateCartSummary();
    });
  });
}

function renderPacks(selector){
  const root = document.querySelector(selector);
  if(!root) return;
  root.innerHTML = '';
  PACKS.forEach(p => {
    const el = document.createElement('div'); 
    el.className = 'pack-card'; // <-- différent de 'card'
    el.innerHTML = `
      <img src="${p.img}" alt="${p.name}" onerror="this.src='images/placeholder.png'"/>
      <h3>${p.name}</h3>
      <p style="color:#6a4f52">${p.desc}</p>
      <div class="price">${formatMAD(p.price)}</div>
      <div class="controls">
        <label>Quantité :</label>
        <div class="qty-wrap">
          <button class="dec">−</button>
          <input type="number" min="1" value="1" class="qty-input"/>
          <button class="inc">+</button>
        </div>
        <button class="btn add-btn">Ajouter au panier</button>
      </div>
    `;
    root.appendChild(el);

    const dec = el.querySelector('.dec'),
          inc = el.querySelector('.inc'),
          qInput = el.querySelector('.qty-input');

    dec.addEventListener('click', ()=> qInput.value = Math.max(1, parseInt(qInput.value)-1));
    inc.addEventListener('click', ()=> qInput.value = Math.min(999, parseInt(qInput.value)+1));

    el.querySelector('.add-btn').addEventListener('click', ()=>{
      const qty = Math.max(1, parseInt(qInput.value));
      addToCartPack(p.id, qty);
      showToast(`${qty} × ${p.name} ajouté au panier`);
      renderCart('#cartRoot');
      updateCartSummary();
    });
  });
}




function addToCartStandard(pid, qty=1){
  const cart = readCart();
  const prod = PRODUCTS.find(x=>x.id===pid);
  if(!prod) return;
  const key = `std__${pid}`;
  const existing = cart.find(i=>i.key===key && i.type==='standard');
  if(existing) existing.qty = Math.min(999, existing.qty + qty);
  else cart.push({ key, type:'standard', id:pid, name:prod.name, price:prod.price, img:prod.img, qty });
  saveCart(cart);
  updateCartSummary();
}


function addToCartPack(pid, qty=1){
  const cart = readCart();
  const pack = PACKS.find(x=>x.id === pid);
  if(!pack) return;

  const key = `pack__${pid}`;
  const existing = cart.find(i => i.key === key && i.type === 'pack');

  if(existing) {
    existing.qty = Math.min(999, existing.qty + qty);
  } else {
    cart.push({
      key,
      type: 'pack',
      id: pid,
      name: pack.name,
      price: pack.price,
      img: pack.img,
      qty
    });
  }

  saveCart(cart);
  updateCartSummary();
}

/* ===== Personnalisation ===== */
function renderPersonalization(selector){
  const root = document.querySelector(selector);
  if(!root) return;
  root.innerHTML = `
    <div style="display:grid;gap:14px">
      <div class="card" style="padding:16px">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <label class="label">Base (choisis la base / parfum)</label>
          <select id="baseSelect" class="custom-select">
            ${PRODUCTS.map(p=>`<option value="${p.id}">${p.name} — ${formatMAD(p.price)}</option>`).join('')}
          </select>

          <label class="label">Quantité</label>
          <div class="qty-wrap">
            <button id="pdec">−</button>
            <input id="pqty" type="number" min="1" value="1" style="width:60px;text-align:center;border:none" />
            <button id="pinc">+</button>
          </div>
        </div>

        <div style="margin-top:12px">
          <div class="label">Choisis le moule</div>
          <div class="mould-gallery" id="mouldGallery"></div>
        </div>

        <div style="margin-top:12px">
          <div class="label">Choisis la couleur</div>
          <div class="color-pills" id="colorPills"></div>
        </div>

        <div style="margin-top:12px;display:flex;gap:10px">
          <button id="addPersonal" class="btn">Ajouter la bougie personnalisée</button>
          <button class="btn outline" onclick="location.href='panier.html'">Voir panier</button>
        </div>
      </div>
    </div>
  `;

  const mg = root.querySelector('#mouldGallery');
  MOULDS.forEach(m=>{
    const card = document.createElement('div'); card.className='mould-card';
    card.innerHTML = `<img src="${m.img}" onerror="this.src='images/placeholder.png'"/><strong>${m.name}</strong><small>+ ${formatMAD(m.surcharge)}</small>`;
    card.dataset.key = m.key;
    mg.appendChild(card);
    card.addEventListener('click', ()=>{
      mg.querySelectorAll('.mould-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  const cp = root.querySelector('#colorPills');
  COLORS.forEach(c=>{
    const pill = document.createElement('div'); pill.className='pill';
    let bg = '#fff';
    if(c.toLowerCase().includes('rose')) bg='#f7c6d0';
    else if(c.toLowerCase().includes('beige')) bg='#f1e0d6';
    else if(c.toLowerCase().includes('blanc')) bg='#fffef8';
    pill.style.background = bg;
    pill.title = c;
    pill.dataset.color = c;
    cp.appendChild(pill);
    pill.addEventListener('click', ()=> {
      cp.querySelectorAll('.pill').forEach(p=>p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  document.getElementById('pdec').addEventListener('click', ()=> { const q = document.getElementById('pqty'); q.value = Math.max(1, parseInt(q.value||1)-1); });
  document.getElementById('pinc').addEventListener('click', ()=> { const q = document.getElementById('pqty'); q.value = Math.min(999, parseInt(q.value||1)+1); });

  document.getElementById('addPersonal').addEventListener('click', ()=>{
    const baseId = parseInt(document.getElementById('baseSelect').value);
    const qty = Math.max(1, parseInt(document.getElementById('pqty').value||1));
    const selectedMouldEl = mg.querySelector('.mould-card.selected');
    const colorEl = cp.querySelector('.pill.selected');
    if(!selectedMouldEl){ alert('Choisis un moule'); return; }
    if(!colorEl){ alert('Choisis une couleur'); return; }
    addToCartPersonal(baseId, qty, colorEl.dataset.color, selectedMouldEl.dataset.key);
    showToast(`${qty} × bougie personnalisée ajoutée`);
    renderCart('#cartRoot');
    updateCartSummary();
  });
}

function addToCartPersonal(baseId, qty, color, mouldKey){
  const cart = readCart();
  const prod = PRODUCTS.find(p=>p.id===baseId);
  const mould = MOULDS.find(m=>m.key===mouldKey);
  const price = prod.price + (mould ? mould.surcharge : 0);
  const key = `pers__${baseId}__${mouldKey}__${color}`;
  const existing = cart.find(i=>i.key===key && i.type==='personal');
  if(existing) existing.qty = Math.min(999, existing.qty + qty);
  else cart.push({ key, type:'personal', id:baseId, name:`${prod.name} (personnalisée)`, price, img:prod.img, qty, color, mould:mouldKey });
  saveCart(cart);
  updateCartSummary();
}

/* ===== Cart ===== */
function renderCart(selector){
  const root = document.querySelector(selector);
  if(!root) return;
  const cart = readCart();
  root.innerHTML = '';
  if(!cart || cart.length===0){
    root.innerHTML = `<p>Ton panier est vide. <a href="produits.html">Voir nos produits</a></p>`;
    updateCartSummary();
    toggleCheckoutButtons();
    return;
  }

  let total = 0;
  cart.forEach(item=>{
    total += item.price * item.qty;
    const row = document.createElement('div'); row.className='cart-item';
    row.innerHTML = `
      <img src="${item.img}" alt="${item.name}" onerror="this.src='images/placeholder.png'"/>
      <div class="meta">
        <h4>${item.name}</h4>
        <div style="color:#785a60">${item.mould ? item.mould + ' • ' : ''}${item.color ? item.color : ''}</div>
        <div style="margin-top:8px;color:#8b6f73">Prix unitaire: <strong>${formatMAD(item.price)}</strong></div>
        <div style="margin-top:8px" class="row">
          <div class="label">Quantité</div>
          <div class="qty-wrap" style="margin-left:8px">
            <button class="dec">−</button>
            <input type="number" min="0" value="${item.qty}" class="qty-input" />
            <button class="inc">+</button>
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="total">${formatMAD(item.price * item.qty)}</div>
        <button class="remove-btn">Supprimer</button>
      </div>
    `;
    root.appendChild(row);

    row.querySelector('.remove-btn').addEventListener('click', ()=>{
      removeCartItem(item.key);
      renderCart(selector);
      updateCartSummary();
    });
    row.querySelector('.dec').addEventListener('click', ()=>{
      const v = Math.max(0, parseInt(row.querySelector('.qty-input').value||0)-1);
      updateCartItemQty(item.key, v); renderCart(selector); updateCartSummary();
    });
    row.querySelector('.inc').addEventListener('click', ()=>{
      const v = Math.min(999, parseInt(row.querySelector('.qty-input').value||0)+1);
      updateCartItemQty(item.key, v); renderCart(selector); updateCartSummary();
    });
    row.querySelector('.qty-input').addEventListener('change', (e)=>{
      const v = Math.max(0, parseInt(e.target.value||0));
      updateCartItemQty(item.key, v); renderCart(selector); updateCartSummary();
    });
  });



  // summary
  const totalQty = cart.reduce((s,i)=>s+i.qty,0);
  const productsTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountRate = getDiscountRate(totalQty);
  const discount = productsTotal * discountRate;
  const totalAfterDiscount = productsTotal - discount;
  const deliveryFee = getDeliveryFee();
  const finalTotal = totalAfterDiscount + deliveryFee;

  const summary = document.createElement('div');
  summary.className = 'cart-summary';
  summary.innerHTML = `
    <div class="summary-row"><span>Articles :</span><span>${totalQty}</span></div>
    <div class="summary-row"><span>Total produits :</span><span>${formatMAD(productsTotal)}</span></div>
    ${discountRate > 0 ? `<div class="summary-row" style="color:#c76a82;font-weight:600">
      Réduction ${discountRate*100}% : − ${formatMAD(discount)}
    </div>` : ""}
    <div class="summary-row"><span>Sous-total :</span><span>${formatMAD(totalAfterDiscount)}</span></div>
    <div class="summary-row"><span>Livraison :</span><span>${formatMAD(deliveryFee)}</span></div>
    <div class="total-row">TOTAL À PAYER : ${formatMAD(finalTotal)}</div>
    <div style="margin-top:12px;display:flex;gap:10px;justify-content:flex-end">
      <button class="btn" onclick="checkoutWhatsApp()">Confirmer via WhatsApp</button>
      <button class="btn outline" onclick="checkoutEmail()">Envoyer par Email</button>
    </div>
  `;
  
  root.appendChild(summary);

  toggleCheckoutButtons();
}

/* ===== Cart helpers ===== */
function updateCartItemQty(key, qty){
  const cart = readCart();
  const i = cart.findIndex(x=>x.key===key);
  if(i===-1) return;
  if(qty<=0) cart.splice(i,1);
  else cart[i].qty = qty;
  saveCart(cart);
}

function removeCartItem(key){
  const cart = readCart().filter(x=>x.key!==key);
  saveCart(cart);
}

function clearCart(){
  localStorage.removeItem(STORAGE_KEY);
  clearPackagingChoice();
  showToast("Panier vidé");
  if(document.querySelector('#cartRoot')) renderCart('#cartRoot');
  updateCartSummary();
}

/* ===== Cart summary ===== */
function updateCartSummary(){
  const cart = readCart();
  const totalQty = cart.reduce((s,i)=>s+i.qty,0);
  const productsTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountRate = getDiscountRate(totalQty);
  const discount = productsTotal * discountRate;
  const afterDiscount = productsTotal - discount;
  const delivery = getDeliveryFee();
  const finalTotal = afterDiscount + delivery;

  const badge = document.getElementById('cartBadge');
  if(badge) badge.textContent = totalQty;

  const miniTotal = document.getElementById('miniTotal');
  if(miniTotal) miniTotal.textContent = formatMAD(finalTotal);

  const deliveryEl = document.getElementById('deliveryFee');
  if(deliveryEl) deliveryEl.textContent = formatMAD(delivery);
}

/* ===== Désactivation si ville non choisie ===== */
function toggleCheckoutButtons(){
  const city = document.getElementById('deliveryCity')?.value;
  const waBtn = document.querySelector('button[onclick="checkoutWhatsApp()"]');
  const mailBtn = document.querySelector('button[onclick="checkoutEmail()"]');
  if(!waBtn || !mailBtn) return;
  const disabled = !city;
  waBtn.disabled = disabled;
  mailBtn.disabled = disabled;
  waBtn.style.opacity = disabled ? "0.5" : "1";
  mailBtn.style.opacity = disabled ? "0.5" : "1";
}

/* ===== Checkout ===== */
function checkoutWhatsApp(){
  const cart = readCart();
  if(!cart || cart.length===0){ alert("Le panier est vide"); return; }
  if(!validateCustomerInfo()){ alert("Merci de remplir TOUTES les informations de livraison."); return; }

  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const city = document.getElementById('deliveryCity').value.trim();
  const region = document.getElementById('deliveryRegion').value;
  const address = document.getElementById('deliveryAddress').value.trim();

  // Calculs
  const totalQty = cart.reduce((s,i)=>s+i.qty,0);
  const productsTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountRate = getDiscountRate(totalQty);
  const discount = productsTotal * discountRate;
  const totalAfterDiscount = productsTotal - discount;
  const deliveryFee = getDeliveryFee();
  const finalTotal = totalAfterDiscount + deliveryFee;

  // Message formaté
  let msg = `Bonjour,%0AJe souhaite passer la commande suivante :%0A%0A`;
  cart.forEach(i=>{
    msg += `- ${i.name} x ${i.qty} : ${formatMAD(i.price*i.qty)}%0A`;
  });
  msg += `%0AArticles : ${totalQty}%0A`;
  msg += `Total produits : ${formatMAD(productsTotal)}%0A`;
  if(discountRate > 0) msg += `Réduction ${discountRate*100}% : - ${formatMAD(discount)}%0A`;
  msg += `Sous-total après réduction : ${formatMAD(totalAfterDiscount)}%0A`;
  msg += `Livraison : ${formatMAD(deliveryFee)}%0A`;
  msg += `TOTAL À PAYER : ${formatMAD(finalTotal)}%0A%0A`;
  msg += `Informations client :%0ANom : ${name}%0ATéléphone : ${phone}%0AEmail : ${email}%0AVille : ${city}%0ARégion : ${region}%0AAdresse : ${address}`;

  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`,'_blank');
}


function checkoutEmail(){
  const cart = readCart();
  if(!cart || cart.length===0){ alert("Le panier est vide"); return; }
  if(!validateCustomerInfo()){ alert("Merci de remplir TOUTES les informations de livraison."); return; }

  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const city = document.getElementById('deliveryCity').value.trim();
  const region = document.getElementById('deliveryRegion').value;
  const address = document.getElementById('deliveryAddress').value.trim();

  // Calculs
  const totalQty = cart.reduce((s,i)=>s+i.qty,0);
  const productsTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountRate = getDiscountRate(totalQty);
  const discount = productsTotal * discountRate;
  const totalAfterDiscount = productsTotal - discount;
  const deliveryFee = getDeliveryFee();
  const finalTotal = totalAfterDiscount + deliveryFee;

  let msg = "Commande :\n\n";
  cart.forEach(i=>{
    msg += `- ${i.name} x ${i.qty} : ${formatMAD(i.price*i.qty)}\n`;
  });
  msg += `\nArticles : ${totalQty}\n`;
  msg += `Total produits : ${formatMAD(productsTotal)}\n`;
  if(discountRate > 0) msg += `Réduction ${discountRate*100}% : - ${formatMAD(discount)}\n`;
  msg += `Sous-total après réduction : ${formatMAD(totalAfterDiscount)}\n`;
  msg += `Livraison : ${formatMAD(deliveryFee)}\n`;
  msg += `TOTAL À PAYER : ${formatMAD(finalTotal)}\n\n`;
  msg += `Informations client :\nNom : ${name}\nTéléphone : ${phone}\nEmail : ${email}\nVille : ${city}\nRégion : ${region}\nAdresse : ${address}`;

  window.location.href = `mailto:${STORE_EMAIL}?subject=Nouvelle commande&body=${encodeURIComponent(msg)}`;
}

/* ===== Customer info validation ===== */
function validateCustomerInfo(){
  const name = document.getElementById('clientName')?.value?.trim();
  const phone = document.getElementById('clientPhone')?.value?.trim();
  const email = document.getElementById('clientEmail')?.value?.trim();
  const city = document.getElementById('deliveryCity')?.value?.trim();
  const address = document.getElementById('deliveryAddress')?.value?.trim();
  const region = document.getElementById('deliveryRegion')?.value;
  return name && phone && email && city && address && region;
}


/* ===== Toast notifications ===== */
function showToast(msg){
  const t = document.createElement('div'); t.className='toast'; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}



