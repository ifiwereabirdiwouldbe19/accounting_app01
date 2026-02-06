# Accounting App 01 📱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-A22846?logo=raspberrypi&logoColor=white)](https://www.raspberrypi.org/)

### [JP] 自宅サーバー連携・会計アプリ
### [EN] A minimal accounting app with Self-Hosted Backend

TypeScript と React Native (Expo) を使用して、日々の支出をストレスなく最速で記録することを目的に開発しました。
本プロジェクトの最大の特徴は、**自宅の Raspberry Pi をサーバーとして運用している「自分専用機」**である点です。

---

## 📸 Screenshots
<div align="center">
  <table>
    <tr>
      <td align="center"><b>Login Screen</b></td>
      <td align="center"><b>Home / Summary</b></td>
    </tr>
    <tr>
      <td><img src="assets/login.jpeg" width="250" alt="Login Screen"></td>
      <td><img src="assets/home.jpeg" width="250" alt="Home Screen"></td>
    </tr>
  </table>
</div>

---

## 🏠 Self-Hosted Infrastructure / インフラ構成

クラウドサービスに依存せず、すべてのデータを自宅内のプライベートな環境で管理しています。

- **Backend Server**: Raspberry Pi (Running Node.js)
- **Database**: MySQL (Managing all transaction data)
- **Communication**: REST API (Connecting App and Raspberry Pi)

---

## ✨ Features / 主な機能

- **⚡️ Speedy Entry / 素早い入力**
  - **JP**: 複雑な設定を排除し、秒で記帳が完了するインターフェース。
  - **EN**: Minimal interface designed for intuitive and effortless data entry within seconds.
 
  - JP: 日本の小口会計で使う出金伝票を集計時にまとめて印刷できます。
  - EN: Enables batch printing of standardized Japanese "Payment Slips" during the summary process, streamlining petty cash workflows.

- **🛡️ Type Safe / 型安全な設計**
  - **JP**: TypeScript をフル活用し、堅牢でメンテナンス性の高いコードベースを実現。
  - **EN**: Robust implementation with 100% type safety using TypeScript.

- **🚀 Private & Secure / プライバシー重視**
  - **JP**: 自宅のラズパイと直接やり取りするため、データが外部に漏れる心配がありません。
  - **EN**: Data is stored locally on a Raspberry Pi, ensuring maximum privacy and data ownership.
  - JP: ラズパイ側のコード（バックエンド）は非公開です。
  - EN: The Raspberry Pi (backend) source code is not included in this repository.

---

## 🛠️ Tech Stack / 使用技術

### Frontend
- **Framework**: React Native / Expo
- **Language**: TypeScript (100%)

### Backend (Self-Hosted)
- **Server**: Node.js / Express
- **Database**: MySQL
- **Hardware**: Raspberry Pi

---

## 🚀 How to Run / 起動方法

### Prerequisites
- Node.js / npm
- Expo Go app on your smartphone
- (Backend server setup on Raspberry Pi)

