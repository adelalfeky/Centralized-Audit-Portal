const corporateIT = require('./departments-corporate-it.js');
const dataAnalytics = require('./departments-data-analytics.js');
const infrastructure = require('./departments-infrastructure.js');
const platforms = require('./departments-platforms.js');
const qa = require('./departments-quality-assurance.js');
const solutionDev = require('./departments-solution-dev.js');
const techStrategy = require('./departments-tech-strategy.js');

console.log('Corporate IT:', corporateIT.corporateIT?.requirements?.length || 'N/A');
console.log('Data Analytics:', dataAnalytics.dataAnalytics?.requirements?.length || 'N/A');
console.log('Infrastructure:', infrastructure.infrastructure?.requirements?.length || 'N/A');
console.log('Platforms:', platforms.platforms?.requirements?.length || 'N/A');
console.log('Quality Assurance:', qa.qualityAssurance?.requirements?.length || 'N/A');
console.log('Solution Dev:', solutionDev.solutionDev?.requirements?.length || 'N/A');
console.log('Tech Strategy:', techStrategy.techStrategy?.requirements?.length || 'N/A');
