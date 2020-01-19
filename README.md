# physiolution_schedule_calibrate

Repozytorium składa się z 3 głównych elementów:
- plik app.py - kod źródłowy aplikcji używającej Flask'a, obsługująca cały backend aplikacji,
- configuration.yaml - plik zawierającego wszystkie wartosci konfiguracyjne aplikacji,
- folder templates - zawiera on wszystkie szablony stron, które są potem przetwarzane przez Flaska.

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

W celu uruchomienia aplikacji należy:
1. Repozytorium sklonować na dysk. 
2. Wejśc do głównego folderu, uruchomić konsolę i wpisać polecenie
"python app.py"

Zostanie wtedy uruchomiony serwer Flask i dostępne będą dwa widoki pod adresami:
- http://127.0.0.1:5000/ - strona do tworzenia harmonogramów przebiegu eksperymentu
- http://127.0.0.1:5000/calibrate - strona do kalibrowania urządzeń pomiarowych

Struktura plików
Pliki umieszczone w folderze templates mają do siebie zbliżoną strukturę - na samej górze załączone są skrypty, poniżej ewentualny kod stylu,
później umieszczona jest zawartość HTML, a na samym dole skrypty JavaScript. 

W pliku app.py na początku umieszczczone są importowane biblioteki, poniżej kontrolery dla określonych routingów, funkcje używane w kontrolerach. 




