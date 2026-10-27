# Портфолио IWaithI

Статичный сайт без сборки: `index.html`, стили и логика в `assets/`, все тексты и работы в `content/`.

## Как добавить работу
1. Картинку (PNG с прозрачным фоном) положить в `media/works/`.
2. В `content/works.js` добавить запись в начало списка:
   ```js
   {
     "id": "short-name",
     "title": "Название",
     "category": "skin",            // "skin" или "4d" (названия фильтров — SITE.categories)
     "lines": ["Строка 1", "Строка 2"],
     "image": "media/works/short-name.png",
     "gallery": ["media/works/short-name-back.png"],   // доп. ракурсы, можно []
     "description": ["Необязательный текст для окна просмотра, **жирный** работает"]
   },
   ```
Новая категория — добавить её в `SITE.categories` в `content/site.js`, фильтр появится сам.

## Тексты, цены, контакты
`content/site.js`: заголовок, «обо мне», карточки цен (`pricing`), плашки под ценами (`perks`, иконки: clock, revisions, paypal, check), Discord и Telegram.
Пустой `telegramUrl` прячет кнопку Telegram. Пустой `discordUrl` — кнопка Discord копирует ник.

## Локальный просмотр
`python -m http.server 8765 -d .` в этой папке, затем http://localhost:8765. Можно и просто открыть `index.html`.
