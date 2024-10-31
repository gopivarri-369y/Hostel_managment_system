'use strict';

const navItems = [
    document.querySelector('#navbar1'),
    document.querySelector('#navbar2'),
    document.querySelector('#navbar3'),
    document.querySelector('#navbar4'),
    document.querySelector('#navbar5'),
    document.querySelector('#navbar6'),
    document.querySelector('#navbar7')
];

// Loop through each navbar item and add event listeners
navItems.forEach((item) => {
    // Use 'mouseenter' event to change the background color
    item.addEventListener('mouseenter', function() {
        item.style.backgroundColor = "#03A9F4"; // Change background color on hover
    });

    // Optionally, reset the background color when the mouse leaves
    item.addEventListener('mouseleave', function() {
        item.style.backgroundColor = ""; // Reset background color when mouse leaves
    });
});

// Handle the header separately (if it has a different behavior)
let header = document.querySelector('.head');
header.addEventListener('mouseenter', function() {
    header.style.color = "red"; // Change text color on hover
});

header.addEventListener('mouseleave', function() {
    header.style.color = ""; // Reset text color when mouse leaves
});
