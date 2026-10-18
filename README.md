# 簡易點餐系統

這是一個靜態前端點餐系統，包含：

- 菜單列表
- 加入訂單功能
- 顯示訂單明細與總價
- 清空購物車、送出訂單
- 顯示本次瀏覽期間送出的訂單紀錄與訂單編號

## 使用方式

1. 透過網站伺服器開啟 `index.html`
2. 點選「加入訂單」
3. 在右側查看訂單內容
4. 按下「送出訂單」完成；訂單送出後會顯示訂單紀錄與 Firebase 訂單編號前 6 碼
5. 可繼續點餐並送出另一筆訂單；紀錄會保留在目前頁面，重新整理後清除

菜單資料預設來自 `menu-data.js`，並會即時讀取同一 Firebase 專案 Firestore 的 `menu` 集合；店家管理頁儲存的價格與照片會同步顯示。`menu` 集合需要允許公開讀取，例如 `allow read: if true;`。若讀取失敗，顧客頁會在瀏覽器 Console 顯示錯誤，並暫時使用預設菜單。

訂單儲存在 Firebase Firestore 的 `orders` 集合。Firestore Rules 至少需要允許符合訂單格式的新增，且不應允許未登入訪客讀取、修改或刪除訂單：

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: if request.resource.data.keys().hasAll([
          'time', 'createdAt', 'items', 'totalAmount', 'status'
        ])
        && request.resource.data.keys().hasOnly([
          'time', 'createdAt', 'items', 'totalAmount', 'status'
        ])
        && request.resource.data.time is string
        && request.resource.data.createdAt == request.time
        && request.resource.data.items is list
        && request.resource.data.items.size() > 0
        && request.resource.data.items.size() <= 100
        && request.resource.data.totalAmount is int
        && request.resource.data.totalAmount >= 0
        && request.resource.data.totalAmount <= 1000000
        && request.resource.data.status == '未處理';
      allow read, update, delete: if false;
    }

    match /menu/{itemId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

若已使用店家後台的 Firestore Rules，請保留其中限制店家更新菜單的規則，不要用此文件的簡化範例覆蓋整份規則。
