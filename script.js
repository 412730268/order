import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { addDoc, collection, getFirestore, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { menu as defaultMenu } from "./menu-data.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9GnZln_CXwrR7rY85QnGi2f95e66G3Dg",
  authDomain: "xinhe-bento.firebaseapp.com",
  projectId: "xinhe-bento",
  storageBucket: "xinhe-bento.firebasestorage.app",
  messagingSenderId: "741579797351",
  appId: "1:741579797351:web:566a0934172d67856575c2",
  measurementId: "G-CFREM0CVFT"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

let menu = defaultMenu;

const order = new Map();
const submittedOrders = [];
const menuList = document.getElementById("menuList");
const orderSummary = document.getElementById("orderSummary");
const totalAmount = document.getElementById("totalAmount");
const submittedOrdersList = document.getElementById("submittedOrders");
const clearOrderBtn = document.getElementById("clearOrderBtn");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const categoryTabs = document.getElementById("categoryTabs");
const customizeModal = document.getElementById("customizeModal");
const sideOptionsContainer = document.getElementById("sideOptions");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const confirmSidesBtn = document.getElementById("confirmSidesBtn");

let activeCategory = "";
let currentBento = null;
let selectedSides = new Set();

const bentoSideOptions = [
  { name: "豆輪", health: "植物蛋白與纖維，適合補充飽足感。" },
  { name: "甜不辣", health: "魚漿蛋白質較高，口感Q彈。" },
  { name: "三角豆腐", health: "低熱量豆製品，含鈣與植物蛋白。" },
  { name: "炒臘腸", health: "香味十足，但脂肪較高，適量食用。" },
  { name: "蔥蛋", health: "蛋白質與蔥香，提供維生素K與鋅。" },
  { name: "茄子", health: "含纖維與鉀，有助於消化與代謝。" },
  { name: "荷包蛋", health: "高品質蛋白質與維生素D來源。" },
  { name: "白菜滷", health: "低卡高纖，適合搭配主餐平衡飲食。" },
  { name: "空心菜", health: "富含維生素A、C與鐵質。" },
  { name: "高麗菜", health: "高纖維、維生素K與葉酸，對腸胃友善。" },
  { name: "大陸妹", health: "多種維生素與礦物質，清爽又營養。" },
  { name: "a菜", health: "高纖維蔬菜，含維生素C與鉀。" },
  { name: "雪裡紅", health: "富含鈣與葉綠素，對骨骼與血液有益。" },
  { name: "南瓜", health: "含β-胡蘿蔔素與維生素A，對視力有幫助。" },
  { name: "小白菜", health: "維生素C與鈣質豐富，低熱量易消化。" },
  { name: "大白菜", health: "高水分與纖維，適合清爽配菜。" },
  { name: "菠菜", health: "含鐵質與葉酸，對補血有幫助。" },
  { name: "番茄炒蛋", health: "番茄維生素C與蛋白質並存，營養均衡。" },
  { name: "菜波能", health: "蔬菜搭配香料，富含纖維與風味。" },
  { name: "咖哩", health: "香料有助食慾，搭配蔬菜可達均衡。" },
  { name: "三色豆", health: "蛋白質與纖維兼具，色彩豐富好吸收。" },
  { name: "土豆絲", health: "馬鈴薯澱粉與鉀質，補充能量不過份油膩。" },
  { name: "韭菜炒蛋", health: "韭菜鐵質搭配蛋白，具有溫補效果。" },
  { name: "香腸", health: "風味強烈，建議少量搭配。" },
  { name: "炒豆芽", health: "低卡高纖，富含維生素B群。" },
  { name: "青江菜", health: "含維生素A與C，口感清爽。" },
  { name: "炒竹筍", health: "竹筍低脂高纖，是健康蔬菜選擇。" },
  { name: "哇哇菜", health: "清爽高纖，適合搭配油膩主餐。" },
  { name: "小魚豆干", health: "鈣質與蛋白質來源，口感香Q。" },
  { name: "蒸蛋", health: "嫩蛋白質，易消化且營養溫和。" },
];

async function saveOrder(orderData) {
  const orderRef = await addDoc(collection(db, "orders"), orderData);
  return orderRef.id;
}

function getCategories() {
  return menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

function renderCategoryTabs() {
  const categories = Object.keys(getCategories());
  if (!activeCategory && categories.length) {
    activeCategory = categories[0];
  }

  categoryTabs.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `category-tab ${category === activeCategory ? "active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => setActiveCategory(category));
    categoryTabs.appendChild(button);
  });
}

function setActiveCategory(category) {
  activeCategory = category;
  renderCategoryTabs();
  renderMenu();
}

function renderMenu() {
  menuList.innerHTML = "";
  const categories = getCategories();
  const items = activeCategory ? categories[activeCategory] : menu;

  if (!items || items.length === 0) {
    menuList.innerHTML = '<p class="empty">此分類目前沒有餐點。</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-item";
    const isBento = item.category === "飯類" && item.name.includes("便當");
    let image;
    if (item.imageUrl) {
      image = document.createElement("img");
      image.className = "menu-image";
      image.src = item.imageUrl;
      image.alt = item.name;
    }
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>價格：NT$ ${item.price}</p>
      <div class="item-bottom">
        <span>單筆價格</span>
        <button data-id="${item.id}">${isBento ? "自訂配菜加入" : "加入訂單"}</button>
      </div>
    `;
    if (image) card.prepend(image);

    const addButton = card.querySelector("button");
    addButton.addEventListener("click", () => {
      if (isBento) openBentoCustomizer(item);
      else addToOrder(item);
    });
    menuList.appendChild(card);
  });
}

function addToOrder(item) {
  const orderKey = item.orderKey || getOrderKey(item);
  const existing = order.get(orderKey) || { ...item, quantity: 0, sides: item.sides || [], extraCharge: item.extraCharge || 0, orderKey };
  existing.quantity += 1;
  order.set(orderKey, existing);
  renderOrder();
}

function getOrderKey(item) {
  if (item.sides && item.sides.length) {
    return `${item.id}|${item.sides.slice().sort().join(",")}|${item.extraCharge || 0}`;
  }
  return `${item.id}`;
}

function openBentoCustomizer(item) {
  currentBento = item;
  selectedSides = new Set();
  renderSideOptions();
  customizeModal.classList.remove("hidden");
}

function closeCustomizer() {
  customizeModal.classList.add("hidden");
  currentBento = null;
  selectedSides = new Set();
}

function renderSideOptions() {
  sideOptionsContainer.innerHTML = "";
  bentoSideOptions.forEach((side) => {
    const option = document.createElement("label");
    option.className = "side-option";
    option.innerHTML = `
      <input type="checkbox" value="${side.name}" />
      <div class="side-label">
        <span class="side-name">${side.name}</span>
        <small class="side-health">${side.health}</small>
      </div>
    `;

    const checkbox = option.querySelector("input");
    checkbox.addEventListener("change", (event) => {
      if (event.target.checked && selectedSides.size >= 4) {
        event.target.checked = false;
        return;
      }
      if (event.target.checked) selectedSides.add(side.name);
      else selectedSides.delete(side.name);
    });
    sideOptionsContainer.appendChild(option);
  });
}

function confirmBentoSides() {
  if (!currentBento) return;
  const sides = Array.from(selectedSides);
  const extraCharge = Math.max(0, sides.length - 3) * 15;
  const customizedItem = {
    ...currentBento,
    quantity: 1,
    sides,
    extraCharge,
    orderKey: getOrderKey({ ...currentBento, sides, extraCharge }),
    name: `${currentBento.name}${sides.length ? ` (${sides.join("、")})` : ""}`,
  };
  addToOrder(customizedItem);
  closeCustomizer();
}

function removeFromOrder(itemId) {
  order.delete(itemId);
  renderOrder();
}

function updateOrderQuantity(orderKey, delta) {
  const item = order.get(orderKey);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    order.delete(orderKey);
  } else {
    order.set(orderKey, item);
  }

  renderOrder();
}

function renderOrder() {
  orderSummary.innerHTML = "";
  const entries = Array.from(order.values());

  if (entries.length === 0) {
    orderSummary.innerHTML = '<p class="empty">目前尚未點餐。</p>';
    totalAmount.textContent = "NT$ 0";
    return;
  }

  let total = 0;
  entries.forEach((item) => {
    const itemTotal = (item.price + (item.extraCharge || 0)) * item.quantity;
    total += itemTotal;

    const orderItem = document.createElement("div");
    orderItem.className = "order-item";
    orderItem.innerHTML = `
      <div class="order-info">
        <span class="item-name">${item.name}</span>
        <span class="item-total">NT$ ${itemTotal}</span>
        ${item.extraCharge ? `<small class="extra-note">含加價 NT$ ${item.extraCharge} (第 4 樣配菜)</small>` : ""}
      </div>
      <div class="item-actions">
        <button class="qty-btn minus" aria-label="減少一份" data-id="${item.id}">－</button>
        <span class="item-qty">${item.quantity}</span>
        <button class="qty-btn plus" aria-label="增加一份" data-id="${item.id}">＋</button>
      </div>
    `;

    const minusButton = orderItem.querySelector(".qty-btn.minus");
    const plusButton = orderItem.querySelector(".qty-btn.plus");
    const orderKey = item.orderKey || getOrderKey(item);

    minusButton.addEventListener("click", () => updateOrderQuantity(orderKey, -1));
    plusButton.addEventListener("click", () => updateOrderQuantity(orderKey, 1));

    orderSummary.appendChild(orderItem);
  });

  totalAmount.textContent = `NT$ ${total}`;
}

function clearOrder() {
  order.clear();
  renderOrder();
}

function renderSubmittedOrders() {
  submittedOrdersList.innerHTML = "";

  if (submittedOrders.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty";
    emptyMessage.textContent = "目前沒有已送出的訂單。";
    submittedOrdersList.appendChild(emptyMessage);
    return;
  }

  submittedOrders.forEach((submittedOrder) => {
    const card = document.createElement("article");
    card.className = "submitted-order-card";

    const heading = document.createElement("strong");
    heading.textContent = `訂單編號：${submittedOrder.id}`;
    card.appendChild(heading);

    const items = document.createElement("ul");
    submittedOrder.items.forEach((item) => {
      const line = document.createElement("li");
      line.textContent = `${item.name} x${item.quantity} - NT$ ${item.price * item.quantity}`;
      items.appendChild(line);
    });
    card.appendChild(items);

    const total = document.createElement("p");
    total.className = "submitted-order-total";
    total.textContent = `總計：NT$ ${submittedOrder.totalAmount}`;
    card.appendChild(total);

    submittedOrdersList.appendChild(card);
  });
}

async function submitOrder() {
  if (order.size === 0) {
    alert("請先加入餐點後再提交訂單。");
    return;
  }

  const orderLines = Array.from(order.values()).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price + (item.extraCharge || 0),
  }));
  const total = Array.from(order.values()).reduce((sum, item) => sum + (item.price + (item.extraCharge || 0)) * item.quantity, 0);

  try {
    submitOrderBtn.textContent = "傳送中...";
    submitOrderBtn.disabled = true;

    const orderId = await saveOrder({
      time: new Date().toLocaleString(),
      createdAt: serverTimestamp(),
      items: orderLines,
      totalAmount: total,
      status: "未處理"
    });
    const orderNumber = orderId.slice(0, 6);

    submittedOrders.push({
      id: orderNumber,
      items: orderLines,
      totalAmount: total,
    });
    renderSubmittedOrders();
    alert("🎉 訂單已成功送出！訂單編號：" + orderNumber);
    clearOrder();
  } catch (error) {
    console.error("寫入資料庫錯誤: ", error);
    if (error?.code === "permission-denied") {
      alert("Firebase Firestore 權限不足，無法送出訂單。請檢查 Firestore Rules 是否允許新增 orders 訂單文件。");
    } else if (error?.code === "unavailable" || error?.code === "deadline-exceeded") {
      alert("目前無法連線到 Firebase，請確認網路後再試一次。");
    } else {
      alert(`訂單送出失敗（${error?.code || error?.message || "未知錯誤"}）。請查看瀏覽器開發者工具的 Console。`);
    }
  } finally {
    submitOrderBtn.textContent = "送出訂單";
    submitOrderBtn.disabled = false;
  }
}

clearOrderBtn.addEventListener("click", clearOrder);
submitOrderBtn.addEventListener("click", submitOrder);
closeModalBtn.addEventListener("click", closeCustomizer);
cancelModalBtn.addEventListener("click", closeCustomizer);
confirmSidesBtn.addEventListener("click", confirmBentoSides);
customizeModal.addEventListener("click", (event) => {
  if (event.target === customizeModal || event.target.classList.contains("modal-backdrop")) {
    closeCustomizer();
  }
});

renderCategoryTabs();
renderMenu();
renderOrder();
renderSubmittedOrders();

onSnapshot(
  collection(db, "menu"),
  (snapshot) => {
    const menuSettings = new Map(
      snapshot.docs.map((menuDoc) => [menuDoc.id, menuDoc.data()])
    );
    menu = defaultMenu.map((item) => ({
      ...item,
      ...(menuSettings.get(String(item.id)) || {}),
    }));

    const currentMenuItems = new Map(menu.map((item) => [String(item.id), item]));
    order.forEach((cartItem) => {
      const updatedItem = currentMenuItems.get(String(cartItem.id));
      if (updatedItem) cartItem.price = updatedItem.price;
    });
    if (currentBento) {
      currentBento = currentMenuItems.get(String(currentBento.id)) || currentBento;
    }

    renderMenu();
    renderOrder();
  },
  (error) => {
    console.error("讀取最新菜單設定失敗:", error);
    alert("無法讀取最新菜單設定，請確認 Firebase 菜單讀取權限；目前暫時顯示預設價格。");
  }
);
