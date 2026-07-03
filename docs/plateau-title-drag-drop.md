# Plateau Title Drag-and-Drop

Drag-and-drop pentru lista `PLATOU > Titles` trebuie sa pastreze lista mixta de titluri si dividers intr-o ordine valida.

Nu pot exista doua dividers consecutive. Regula se aplica atat la adaugare, cat si la drag-and-drop: un drop care ar produce `divider, divider` este anulat, lista ramane in ordinea veche si nu porneste persistenta CSV.

Doua dividers sunt permise numai daca intre ele exista cel putin un title.
