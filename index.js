class EventCache {

    /**
     * @param {number} lifeTime время хранения события в памяти
     * @param {number} maxLength максимальное количество хранимых событий для пользователя
     */
    constructor(lifeTime=5*60*1000, maxLength=50) {

        this.lifeTime = lifeTime;
        this.maxLength = maxLength;

        this.recipients = {};

    }


    /**
     * @param {number} recipientId
     */
    check(recipientId) {

        if (this.recipients[ recipientId ] === undefined) {
            this.recipients[ recipientId ] = {};
        }

        if (this.recipients[ recipientId ].listeners === undefined) {
            this.recipients[ recipientId ].listeners = {};
        }

        if (this.recipients[ recipientId ].queue === undefined) {
            this.recipients[ recipientId ].queue = [];
        }

        if (this.recipients[ recipientId ].queue.length > (this.maxLength - 1)) {
            this.recipients[ recipientId ].queue.shift();
        }

    }


    /**
     * Отправляет событие пользователю `recipientId`
     * 
     * @param {number} recipientId идентификатор получателя
     * @param {string} type тип события
     * @param {object} event данные события
     */
    push(recipientId, type, data) {

        this.check(recipientId);

        let eventId = Date.now() + '_' + Math.random(),
            event   = {id: eventId, type, data};

        this.recipients[ recipientId ].queue.push(event);

        if (typeof this.recipients[ recipientId ].timer !== undefined) {
            clearTimeout(this.recipients[ recipientId ].timer);
        }

        this.recipients[ recipientId ].timer = setTimeout(() => {
            delete this.recipients[ recipientId ].queue;
        }, this.lifeTime);

        for (let listenerId in this.recipients[ recipientId ].listeners) {

            let callback = this.recipients[ recipientId ].listeners[ listenerId ];
            callback([event]);

        }

        delete this.recipients[ recipientId ].listeners;

    }


    /**
     * Подписывается на события пользователя `recipientId`
     * 
     * @param {number} recipientId идентификатор получателя
     * @param {function} callback функция обратного вызова
     * @param {string} lastEventId идентификатор последнего события
     * 
     * @returns {string} идентификатор подписчика
     */
    addEventListener(recipientId, callback, lastEventId) {

        this.check(recipientId);

        if (lastEventId) {

            let idx = this.recipients[ recipientId ].queue.findIndex(event => event.id === lastEventId);

            if (idx !== -1 && idx < this.recipients[ recipientId ].queue.length - 1) {

                let events = this.recipients[ recipientId ].queue.slice(idx + 1);
                return callback(events);

            }

        }

        let listenerId = Date.now() + '_' + Math.random();

        this.recipients[ recipientId ].listeners[ listenerId ] = callback;
        return listenerId;

    }


    /**
     * Отписывается от событий пользователя `recipientId`
     * 
     * @param {number} recipientId идентификатор получателя
     * @param {string} listenerId идентификатор подписчика
     */
    removeEventListener(recipientId, listenerId) {

        this.check(recipientId);
        delete this.recipients[ recipientId ].listeners[ listenerId ];

    }

}

const EC = new EventCache();

module.exports = EC;