# Accounting App 01 📱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/license/MIT)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Raspberry Pi](https://img.shields.io/badge/Raspberry_Pi-A22846?logo=raspberrypi&logoColor=white)](https://www.raspberrypi.org/)

### [JP] 自宅サーバー連携・会計アプリ
### [EN] A minimal accounting app with Self-Hosted Backend

TypeScript と React Native (Expo) を使用して、日々の支出をストレスなく最速で記録することを目的に開発しました。
自宅の Raspberry Pi をサーバーとして運用している「自分専用機」です。自分のmacでビルドしてTestflight等にあげれば、iphoneアプリとして動きます。
app.jsonやeas.jsonのバンドルIDは伏せてます。よかったら試してみて欲しいです。

Built with TypeScript and React Native (Expo), this app is designed for lightning-fast, zero-friction expense tracking.
It's my own 'private machine' setup, running on a Raspberry Pi home server. You can run it on your iPhone by building it on a Mac and using TestFlight. I’ve omitted the bundle IDs in the config files, but I'd love for you to check it out!


## Screenshots
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

## Self-Hosted Infrastructure / インフラ構成

クラウドサービスに依存せず、すべてのデータを自宅内のプライベートな環境で管理しています。

- **Backend Server**: Raspberry Pi (Running Node.js)
- **Database**: MySQL (Managing all transaction data)
- **Communication**: REST API (Connecting App and Raspberry Pi)

> [!IMPORTANT]
> - **JP**: ラズパイ側のコード（バックエンド）は非公開です。
> - **EN**: The Raspberry Pi (backend) source code is not included in this repository.

---

## Features / 主な機能

- **Speedy Entry / 入力は少し早い**
  - **JP**: 複雑な設定を排除し、秒で記帳が完了するインターフェース。
  - **EN**: Minimal interface designed for intuitive and effortless data entry within seconds.

- **Batch Printing / 精算書類の印刷**
  - **JP**: 精算書や出金伝票の印刷機能がありますが、これらはあくまで参照用のサンプルであり、法的な要件や公式な会計基準に厳密に基づいたものではありません。
  - **EN**: While the app can generate and print summary reports and payment slips, these are provided as samples for reference only and do not strictly comply with official legal or accounting standards.

- **Type Safe / 型安全な設計**
  - **JP**: TypeScript をフル活用し、堅牢でメンテナンス性の高いコードベースを実現したい。
  - **EN**: Robust implementation with 100% type safety using TypeScript.

- ** Private & Secure / プライバシー重視**
  - **JP**: 自宅のラズパイと直接やり取りするため、データが外部に漏れる心配がありません。
  - **EN**: Data is stored locally on a Raspberry Pi, ensuring maximum privacy and data ownership.

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

## ⚠️ Disclaimer / 免責事項

- **JP**: 本アプリの使用によって生じた、いかなる損害（データ損失、計算ミス、その他付随するトラブル等）についても、作者は一切の責任を負いません。個人の学習・趣味の範囲で、自己責任にてご利用ください。
- **EN**: The author shall not be held liable for any damages (including but not limited to data loss, calculation errors, or other issues) arising from the use of this application. Use this app at your own risk for personal or educational purposes only.

---

## 👤 Author
- **GitHub**: [@ifiwereabirdiwouldbe19](https://github.com/ifiwereabirdiwouldbe19)
