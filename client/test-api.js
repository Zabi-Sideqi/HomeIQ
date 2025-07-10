// Test script to check API URL logic
import { apiUrl } from './src/utils/api.js'

console.log('Testing API URL logic...')
console.log('Environment DEV:', process.env.NODE_ENV !== 'production')
console.log('API URL for /api/listing/get:', apiUrl('/api/listing/get'))
console.log('API URL for /api/user/favorites:', apiUrl('/api/user/favorites'))
