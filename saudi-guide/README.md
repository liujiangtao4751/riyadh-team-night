# 初到利雅得 · 沙特外派落地指南

手机优先的静态办事指南，独立入口 `/riyadh-team-night/saudi-guide/`。根目录团建网页保持不变，使用同一个 GitHub Pages Actions 部署。

## 文件与预览

- `index.html`：完整办理说明，JS 不可用时官方入口及导航仍可使用。
- `styles.css`：手机 / 桌面布局及地图样式。
- `app.js`：地点选取、路线方向、地图与复制地址。
- `places.json`：核实坐标、来源和双向道路路线；更新时必须保留来源与日期。
- `vendor/`：固定版本 Leaflet 1.9.4 分发文件及许可证。

无需打包。通过任意 HTTP 静态服务器打开目录；`file://` 下浏览器可能阻止读取 JSON，所以正式使用 GitHub Pages 或本地 HTTP 预览。

## 导航与路线口径

默认显示地点到 Windows Office 的自驾道路距离和模型耗时，支持切换公司出发。列表“导航去…”固定以公司为起点；地图主按钮遵循所选方向；“导航到公司”交给 Google Maps 选择当前起点。

Windows Office 坐标为 `24.821698,46.6516289`，来自用户收藏实体。本指南不沿用旧团建集合点 `24.828769,46.651329`。

OSRM / OpenStreetMap 路线计算日期为 2026-09-08（地点核验于 2026-09-07）。`routes[placeId][direction].source` 保留可复现请求，距离为米，耗时为秒，GeoJSON 坐标为经度、纬度；展示时公里保留一位、分钟向上取整。不是直线距离，不含实时交通、停车、步行、排队。底图仅请求当前交互视口，不预下载或提供离线缓存。

机场航站楼、驾照最终预约网点未指定，因此只提供官方 / 地图查询入口，不代填坐标和车程。RAYA7140 仅核实门牌位置，终端可用性来自用户经验。

## 内容来源

- 用户经验：酒店设施与步行、机场柜台、体检耗时、HR 联系人、保险/Iqama 进度、SIM 换绑经历、线下终端、驾照联系人报价、预约放号传闻、领卡时间、悦澜月租。
- STC 当前含税套餐价格：https://www.stc.com.sa/en/personal/mobile/packages/sawa-ziyara.html
- Absher 官方：https://www.absher.sa/
- Nafath 官方手册（包含 Absher 自助激活）：https://www.iam.gov.sa/guides/userGuideEn.pdf
- SAB 数字开户：https://www.sab.com/en/personal/ways-to-bank/e-account-opening/
- SAB 分行官方定位：https://www.sab.com/en/personal/ways-to-bank/handicap-branches/
- 驾照年费：网页中的 MOI 官方费表链接（40 SAR / 年；翻译与体检另计）。

不记录手机号、证件号、保险表或其他个人敏感材料；此页面不是业务系统，不接收申请或收费。
