let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore('pendingTransactions', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    if (window.navigator.online) {
        console.log('window online');
        checkIndexDb();
    }
};

request.onerror = function(event) {
    console.log(event.target.error);
};

function saveRecord(record) {
    const transaction = db.transaction('pendingTransactions', 'readwrite');
    const store = transaction.createObjectStore('pendingTransactions');

    store.add(record);
}

function checkIndexDb() {
    const transaction = db.transaction('pendingTransactions', 'readwrite');
    const store = transaction.createObjectStore('pendingTransactions');
    const getAll = store.getAll();
    
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(() => {
                const transaction = db.transaction(['pendingTransactions'], 'readwrite');
                const store = transaction.objectStore('pendingTransactions');

                store.clear();
            });
        }
    };
}

window.addEventListener('online', checkIndexDb);
