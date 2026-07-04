# Backup zilnic dedicat titlurilor din PLATOU

Backupul de istoric pentru titlurile din PLATOU este separat de backupurile CSV existente ale proiectului complet. Backupurile normale continua sa salveze continutul integral al CSV-ului de lucru, in timp ce backupul dedicat titlurilor contine doar lista operabila de titluri si separatoare din sectiunea PLATOU.

## Format

Fisierul dedicat este un CSV cu o singura coloana, fara header si fara coloana `Nr`.

Exemplu:

```csv
Primul titlu
[ DIVIDER ]
Al doilea titlu
```

Separatorul este scris exact ca `[ DIVIDER ]`. Ordinea titlurilor si separatorilor este pastrata. Exportul nu include titluri din BETA, persoane, locatii, hot titles, wait titles sau alte date din proiect.

## Nume si rezervare

Numele fisierului este rezervat la crearea unui proiect nou si este pastrat in configuratia interna `activeTitleBackupFile`.

Formatul numelui este:

```text
DD_MM_YYYY_titluri.csv
DD_MM_YYYY_titluri_2.csv
DD_MM_YYYY_titluri_3.csv
```

Primul proiect al zilei foloseste numele fara sufix. Proiectele urmatoare primesc primul sufix liber. La restart, identificatorul persistent este pastrat, astfel redeschiderea aplicatiei continua acelasi proiect. Incarcarea unui proiect salvat nu rezerva automat alt nume; doar actiunea Proiect nou schimba identificatorul.

## Retentie

Folderul folosit este folderul de backup configurat in Settings. Retentia se aplica doar fisierelor dedicate care respecta formatul `DD_MM_YYYY_titluri.csv` sau `DD_MM_YYYY_titluri_N.csv`.

Se pastreaza maximum 10 fisiere dedicate. Backupurile normale nu sunt afectate. Cand limita este depasita, se sterge cel mai vechi fisier dupa timestamp-ul real al fisierului. Fisierul activ din `activeTitleBackupFile` nu este sters.

## Ordinea scrierilor

Dupa o modificare reusita a listei de titluri din PLATOU, ordinea este:

1. CSV-ul integral de lucru.
2. `PA_titles.csv`.
3. Backupul dedicat titlurilor, numai daca `PA_titles.csv` a fost scris cu succes.
4. `PA_titles_with_hot.csv` si restul exporturilor conform fluxului aplicatiei.

Backupul este incercat dupa modificari precum add/edit/delete title, add/delete divider, reorder title, reorder divider si import titles, atata timp cat modificarea trece prin scrierea CSV-ului de lucru si exportul `PA_titles.csv`.

## Erori

Daca `PA_titles.csv` esueaza, backupul dedicat nu este scris. Daca backupul dedicat esueaza, nu se face rollback pentru CSV-ul integral sau pentru `PA_titles.csv`; se trimite o notificare separata pentru `titleBackup`, iar urmatoarea modificare va incerca din nou scrierea backupului activ.

Scrierea backupului dedicat este atomica: continutul este scris intr-un fisier temporar si apoi redenumit peste fisierul activ. Scrierea are maximum 3 incercari, iar fisierele temporare sunt curatate dupa esec.
