# Gamified Task Manager

## 📌 Über das Projekt
Web-App zur Verbesserung der Teamfähigkeit digitaler Gruppen durch Gamification-Elemente, entwickelt im Rahmen der Bachelorarbeit.

Das Projekt ist eine Webanwendung und zugleich ein spielerischer Kanban-Task-Manager, der die Zusammenarbeit im Team motivierend gestaltet.
Erstelle dein eigenes Team oder trete einem bestehenden bei, um gemeinsam Aufgaben zu organisieren und abzuarbeiten – ganz im klassischen Kanban-Stil.

Innerhalb deines Teams siehst du jederzeit, wer gerade vorne liegt, und kannst dich mit deinen Teammitgliedern  messen. So wird Teamarbeit nicht nur effizient, sondern auch ein  zum Spiel.

### Features
- **Level-System** – Steige auf & sammle Punkte für erledigte Tasks  
- **Daily Streaks** – Logge dich täglich ein & verdiene Bonus-Points  
- **Team-Punkte** – Verfolge Fortschritte pro Team/Projekt  
- **Deadline-Tracker** – Nie wieder vergessene Tasks  
- **Prioritäts-Flags** – Kritische Aufgaben zuerst  

### Projekt starten

Voraussetztung ist Docker
```bash
git clone https://github.com/maile000/TaskManager.git
cd TaskManager
docker-compose -f docker-compose.prod.yml up --build

