// بيانات الصيدليات مع الاحداثيات
const pharmacies = [
    {name: "صيدلية الشفاء", address: "شارع فلسطين، بغداد", lat: 33.3345, lng: 44.4000},
    {name: "صيدلية الرازي", address: "شارع الزهور، بغداد", lat: 33.3400, lng: 44.4100},
    {name: "صيدلية السلام", address: "شارع حيفا، بغداد", lat: 33.3350, lng: 44.4200}
];

// إنشاء خريطة Leaflet
const map = L.map('map').setView([33.338, 44.410], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

pharmacies.forEach(pharmacy => {
    L.marker([pharmacy.lat, pharmacy.lng])
        .addTo(map)
        .bindPopup(`<b>${pharmacy.name}</b><br>${pharmacy.address}`);
});

// حساب المسافة بالكيلومتر
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2)**2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// وقت التوصيل بالدقائق
function getDeliveryTime(distanceKm, speedKmH = 40) {
    return Math.ceil((distanceKm / speedKmH) * 60);
}

// البحث وترتيب الصيدليات
function searchMedicine() {
    const input = document.getElementById('medicineInput').value.trim();
    const listDiv = document.getElementById('pharmacyList');
    listDiv.innerHTML = '';

    if(input === '') {
        alert("يرجى إدخال اسم الدواء");
        return;
    }

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            pharmacies.forEach(pharmacy => {
                pharmacy.distance = getDistance(userLat, userLng, pharmacy.lat, pharmacy.lng);
                pharmacy.deliveryTime = getDeliveryTime(pharmacy.distance);
            });

            const sortedPharmacies = pharmacies.sort((a, b) => a.distance - b.distance);

            sortedPharmacies.forEach((pharmacy, index) => {
                const div = document.createElement('div');
                div.className = 'pharmacy-item';
                if(index === 0) div.style.border = "2px solid #FF5722";
                div.innerHTML = `
                    <div>
                        <strong>${pharmacy.name}</strong><br>
                        ${pharmacy.address}<br>
                        دواء متوفر: ${input}<br>
                        المسافة: ${pharmacy.distance.toFixed(2)} كم<br>
                        وقت التوصيل التقريبي: ${pharmacy.deliveryTime} دقيقة
                    </div>
                    <button onclick="choosePayment('${input}', '${pharmacy.name}', ${pharmacy.deliveryTime})">طلب</button>
                `;
                listDiv.appendChild(div);
            });

        }, error => {
            alert("تعذر الحصول على موقعك. سيتم عرض الصيدليات بدون ترتيب حسب المسافة.");
            displayPharmaciesWithoutDistance(input);
        });
    } else {
        alert("جهازك لا يدعم تحديد الموقع. سيتم عرض الصيدليات بدون ترتيب حسب المسافة.");
        displayPharmaciesWithoutDistance(input);
    }
}

function displayPharmaciesWithoutDistance(input) {
    const listDiv = document.getElementById('pharmacyList');
    pharmacies.forEach(pharmacy => {
        const div = document.createElement('div');
        div.className = 'pharmacy-item';
        div.innerHTML = `
            <div>
                <strong>${pharmacy.name}</strong><br>
                ${pharmacy.address}<br>
                دواء متوفر: ${input}
            </div>
            <button onclick="choosePayment('${input}', '${pharmacy.name}', 'غير محدد')">طلب</button>
        `;
        listDiv.appendChild(div);
    });
}

// اختيار طريقة الدفع
function choosePayment(medicine, pharmacy, deliveryTime) {
    const payment = prompt("اختر طريقة الدفع:\n1 - عند الاستلام\n2 - الدفع أونلاين", "1");
    let paymentMethod = "";
    if(payment === "1") paymentMethod = "الدفع عند الاستلام";
    else if(payment === "2") paymentMethod = "الدفع أونلاين";
    else {
        alert("طريقة الدفع غير صحيحة، سيتم اختيار الدفع عند الاستلام تلقائياً.");
        paymentMethod = "الدفع عند الاستلام";
    }
    orderMedicine(medicine, pharmacy, deliveryTime, paymentMethod);
}

// تأكيد الطلب وإضافة للسجل مع تحديث الحالة تلقائياً
function orderMedicine(medicine, pharmacy, deliveryTime, paymentMethod) {
    const order = {
        medicine,
        pharmacy,
        deliveryTime,
        paymentMethod,
        status: "قيد التحضير",
        date: new Date().toLocaleString()
    };

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    alert(`تم طلب ${medicine} من ${pharmacy} بنجاح!\nوقت التوصيل المتوقع: ${deliveryTime} دقيقة\nطريقة الدفع: ${paymentMethod}`);

    displayOrderHistory();

    const orderIndex = orders.length - 1;

    // تحديث الحالة تلقائياً بعد 1 دقيقة -> "في التوصيل"
    setTimeout(() => updateOrderStatus(orderIndex, "في التوصيل"), 60000);

    // بعد 3 دقائق -> "تم التوصيل"
    setTimeout(() => updateOrderStatus(orderIndex, "تم التوصيل"), 180000);
}

// تحديث حالة الطلب في LocalStorage وعرضها
function updateOrderStatus(index, newStatus) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    if(orders[index]) {
        orders[index].status = newStatus;
        localStorage.setItem("orders", JSON.stringify(orders));
        displayOrderHistory();
    }
}

// عرض سجل الطلبات
function displayOrderHistory() {
    const ordersDiv = document.getElementById('orderHistory');
    if(!ordersDiv) return;
    ordersDiv.innerHTML = "<h3>سجل الطلبات:</h3>";

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    if(orders.length === 0) {
        ordersDiv.innerHTML += "<p>لا توجد طلبات سابقة.</p>";
        return;
    }

    orders.forEach((order, index) => {
        const div = document.createElement('div');
        div.className = 'pharmacy-item';
        div.innerHTML = `
            <strong>طلب #${index+1}</strong><br>
            الدواء: ${order.medicine}<br>
            الصيدلية: ${order.pharmacy}<br>
            وقت التوصيل: ${order.deliveryTime} دقيقة<br>
            طريقة الدفع: ${order.paymentMethod}<br>
            الحالة: ${order.status}<br>
            التاريخ: ${order.date}
        `;
        ordersDiv.appendChild(div);
    });
}

// تحميل سجل الطلبات عند بدء الصفحة
window.onload = displayOrderHistory;
