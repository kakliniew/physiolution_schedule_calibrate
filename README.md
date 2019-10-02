# physiolution_schedule_calibrate

Repozytorium należy sklonować na dysk.
Składa się ono z 3 głównych elementów:
- pliku app.py - jest to aplikcja Flask obsługująca cały backend aplikacji
- configuration.yaml - pliku zawierającego wszystkie wartosci konfiguracyjne aplikacji
- folderu templates - zawiera on wszystkie szablony stron, które są potem przetwarzane przez Flaska.

Wszystkie skrypty używane przez aplikację są składowane w CDN, dlatego nie znajdują się w folderze lokalnie. Jednak wymaga to połączenia z internetem przy uruchomianiu aplikacji.
Używane skrypty to:
- Chart.js 
- jQuery
- Moment.js
- dragData.js

Do uruchomienia aplikaji będzie jednak potrzebne:
- Python 3.7
- przeglądarka internetowa
- Flask
- PyYaml

W celu uruchomienia aplikacji należy wejśc do głównego folderu i wpisać w konsoli polecenie
"python app.py"

Zostanie wtedy uruchomiony serwer Flask i dostępne będą dwa widoki pod adresami:
- http://127.0.0.1:5000/time_chart.html - strona do tworzenia harmonogramów przebiegu eksperymentu
- http://127.0.0.1:5000/calibrate.html - strona do kalibrowania urządzeń pomiarowych



