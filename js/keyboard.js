/* eslint-disable no-dupe-else-if */
/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable no-tabs */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable import/no-unresolved */
/* eslint-disable linebreak-style */
/* eslint-disable no-param-reassign */
/* eslint-disable import/extensions */

import * as storage from './storage.js';
import create from './create.js';
import language from './index.js';
import Key from './key.js';

const main = create(
  'main',
  '',
  [create('h1', 'title', 'Virtual Keyboard'),
    create('h4', 'subtitle', 'Keyboard has been made under Widows OS'),
    create('p', 'hint', 'To switch language use button en or ru. To hide keyboard use button &#9660')],
);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
    this.isRu = true;
  }

  init(langCode) {
    this.keyBase = language[langCode];
	 // создание поля вввода
    this.output = create(
      'textarea',
      'output',
      null, // не имеет доч элементов
      main,
      ['placeholder', 'typing...'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off'], // при вводе рандомного текста отменяет подчеркивание и тд
    );
    this.container = create('div', 'keyboard hidden', null, main, ['language', langCode]);

    if (langCode === 'ru') {
      this.isRu = true;
    } else if (langCode === 'en') {
      this.isRu = false;
    }
    document.body.prepend(main);
    return this;
  }

  // отрисовка разметки клавиатуры,клавиш
  generateLayout() {
    this.keyButtons = []; // инстансы кнопок
    this.rowsOrder.forEach((row, i) => { // итерация по массиву кнопок
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      // итерация по кодам кнопок
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });

    const textOutput = document.querySelector('.output');
    textOutput.addEventListener('click', () => {
      this.container.classList.remove('hidden');
    });
    // вызов функ в ответ на нажатие и мышь
    document.addEventListener('keydown', this.handleEvent);
    document.addEventListener('keyup', this.handleEvent);
    this.container.onmousedown = this.preHandleEvent;
    this.container.onmouseup = this.preHandleEvent;
  }

  // клик по какому-либо html-элементу случайно
  preHandleEvent = (e) => {
    e.stopPropagation();
    const keyDiv = e.target.closest('.keyboard__key'); // получить ближайший элемент
    if (!keyDiv) return;
    const { dataset: { code } } = keyDiv;
    keyDiv.addEventListener('mouseleave', this.resetButtonState);
    this.handleEvent({ code, type: e.type });
  };

  // Функцияя обработки событий

  handleEvent = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    const { code, type } = e;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return; // не реагировать на событие, если объект не найден
    this.output.focus(); // фокусирование на поле вывода при наборе текста

    // действия при нажатии кнопки или мыши
    if (type.match(/keydown|mousedown/)) {
      if (!type.match(/mouse/)) e.preventDefault();

      keyObj.div.classList.add('active');

      if (code.match(/Hide/)) {
        this.container.classList.add('hidden');
      } else {
        this.container.classList.remove('hidden');
      }
      // перекл языка
      if (code.match(/Control|Alt|Caps|LangKey/) && e.repeat) return;

      if (code.match(/Control/)) this.ctrKey = true;
      if (code.match(/Alt/)) this.altKey = true;
      if (code.match(/LangKey/)) this.switchLanguage();
      // заглавная буква клавищ при капсб обработка отжатия
      if (code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (code.match(/Caps/) && this.isCaps) {
        this.isCaps = false;
        this.switchUpperCase(false);
        keyObj.div.classList.remove('active');
      }

      // определить спец или основной символ, в зависимости зажат ли капс,шифт
      if (!this.isCaps) {
        // капс не нажат,проверяем нажат ли шифт
        this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
        this.switchUpperCase(false);
      } else if (this.isCaps) {
        // активен капслок
        if (this.shiftKey) {
          // шифт нажат, кнопки со спецсимволами получают верх регистр
          this.printToOutput(keyObj, keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        } else {
          // не нажат шифт, обычные кпопки в верх регистре
          this.printToOutput(keyObj, !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small);
        }
      }
      this.keysPressed[keyObj.code] = keyObj;

    // кнопка отжата
    } else if (e.type.match(/keyup|mouseup/)) {
      this.resetPressedButtons(code);
      if (code.match(/Shift/) && this.shiftKey) {
        this.shiftKey = false;
        keyObj.div.classList.remove('active');
        this.switchUpperCase(false);
      } else if (code.match(/Shift/)) {
        this.shiftKey = true;
        this.switchUpperCase(true);
        keyObj.div.classList.add('active');
      }

      if (code.match(/Control/)) this.ctrKey = false;
      if (code.match(/Alt/)) this.altKey = false;

      if (!(code.match(/Caps|Shift/))) {
        keyObj.div.classList.remove('active');
      }
    }
  };

  resetButtonState = ({ target: { dataset: { code } } }) => {
    if (code.match('Shift')) {
      this.shiftKey = false;
      this.switchUpperCase(false);
      this.keysPressed[code].div.classList.remove('active');
    }
    if (code.match(/Control/)) this.ctrKey = false;
    if (code.match(/Alt/)) this.altKey = false;
    this.resetPressedButtons(code);
    this.output.focus();
  };

  resetPressedButtons = (targetCode) => {
    if (!this.keysPressed[targetCode]) return;
    if (!targetCode.match(/Caps|Shift/)) this.keysPressed[targetCode].div.classList.remove('active');
    this.keysPressed[targetCode].div.removeEventListener('mouseleave', this.resetButtonState);
    delete this.keysPressed[targetCode];
  };

  // поднятие регистра
  switchUpperCase(isTrue) {
    // проверка понять поднимает или нет регистр
    if (isTrue) {
      this.keyButtons.forEach((button) => {
        // перерисовка стилей кнопок, у которых спец символы есть
        if (button.sub) {
          // нажат шифт, а не капс лок
          if (this.shiftKey) {
            button.sub.classList.add('sub-active');
            button.letter.classList.add('sub-inactive');
          } else if (!this.shiftKey) {
            button.sub.classList.remove('sub-active');
            button.letter.classList.remove('sub-inactive');
          }
        }

        // зажата кнопка без спец символа, зажат капс, не зажат шифт и пустое поле саб
        if (!button.isFnKey && this.isCaps && !this.shiftKey && !button.sub.innerHTML) {
          //  тогда символы в леттер  в высоком регистре
          button.letter.innerHTML = button.shift;
        // зажат капс+шифт
        } else if (!button.isFnKey && this.isCaps && this.shiftKey) {
          // маленький регистр для основных символов
          button.letter.innerHTML = button.small;
        } else if (!button.isFnKey && !button.sub.innerHTML) {
          button.letter.innerHTML = button.shift;
        }
      });
    } else {
      // переключение стиля если есть спец символ, и любая не пустая срока
      this.keyButtons.forEach((button) => {
        if (button.sub.innerHTML && !button.isFnKey) {
          button.sub.classList.remove('sub-active');
          button.letter.classList.remove('sub-inactive');
          // если не зажат капс, для основныъ клавищ возвращаем верх регистр
          if (!this.isCaps) {
            button.letter.innerHTML = button.small;
          } else if (!this.isCaps) {
            button.letter.innerHTML = button.shift; // капс зажат,регистр верхний
          }
        // кнопка без спец символа, при зажатом капс переключение регистра на верх, в противном случае нижний
        } else if (!button.isFnKey) {
          if (this.isCaps) {
            button.letter.innerHTML = button.shift;
          } else {
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
  }

  // изменить язык
  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    // переменная, содержащая индекс языка
    let langIdx = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[langIdx += 1]]
      : language[langAbbr[langIdx -= langIdx]];

    this.container.dataset.language = langAbbr[langIdx];
    storage.set('kbLang', langAbbr[langIdx]);

    if (langAbbr[langIdx] === 'ru') {
      this.isRu = true;
    } else if (langAbbr[langIdx] === 'en') {
      this.isRu = false;
    }

    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      button.shift = keyObj.shift;
      button.small = keyObj.small;
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerHTML = keyObj.shift;
      } else {
        button.sub.innerHTML = '';
      }
      button.letter.innerHTML = keyObj.small;
    });
    if (this.isCaps) this.switchUpperCase(true);
  };

  // работа функциональных кнопок
  printToOutput(keyObj, symbol) {
    // получаем позицию курсора
    let cursorPos = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPos); // все,что слева от курсора
    const right = this.output.value.slice(cursorPos); // справа от курсора
    const textHandlers = {
      Tab: () => {
        this.output.value = `${left}\t${right}`; // табуляция
        cursorPos += 1;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => {
        cursorPos += 1;
      },
      ArrowUp: () => {
        const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPos -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [[1]];
        cursorPos += positionFromLeft[0].length;
      },
      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPos += 1;
      },
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos -= 1;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos += 1;
      },
    };
    if (textHandlers[keyObj.code]) {
      textHandlers[keyObj.code]();
      this.shiftKey = false;
    } else if (!keyObj.isFnKey) {
      cursorPos += 1;
      this.output.value = `${left}${symbol || ''}${right}`;
      this.shiftKey = false;
      const shiftBtn = document.querySelector('div[data-code="ShiftLeft"]');
      shiftBtn.classList.remove('active');
      if (this.isCaps) {
        this.switchUpperCase(true);
      }
    }
    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
