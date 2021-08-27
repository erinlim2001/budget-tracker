let db;
let budgetVersion;

const request = indexedDB.open('budgetDB', budgetVersion || 2);
request.onupgradeneeded = function(e) {
    const newVersion = e.newVersion || db.version;

    console.log(`DB updated Version is now: ${newVersion}`)

    db = e.target.result;

    if(db.objectStoreNames.length === 0) {
        db.createObjectStore('BudgetStore', {autoIncrement: true})
    }
};

request.onerror = function (e) {
    console.log(e.target.errorCode)
};

function checkDatabase () {
    let transaction = db.transaction(['BudgetStore'], 'readwrite');
    const store = transaction.objectStore('BudgetStore');
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'applcation/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => response.json())
            .then((res) => {
                if (res.length !== 0) {
                    transaction = db.transaction(['BudgetStore'], 'readwrite');

                    const currentStore = transaction.objectStore('BudgetStore');

                    currentStore.clear();
                    console.log('Clearing!');
                }
            })
        }
    }
}
request.onsuccess = function(e) {
    db = e.target.result;

    if(navigator.onLine) {
        console.log('backend working');
        checkDatabase();
    }
}

const saveRecord = (record) => {
    console.log('save record');
    const transaction = db.transaction(['BudgetStore'], 'readwrite');
    const store = transaction.objectScore('BudgetStore');
    store.add(record);
};
window.addEventListener('online', checkDatabase)