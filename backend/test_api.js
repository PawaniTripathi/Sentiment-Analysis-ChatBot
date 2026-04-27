const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:5000/api/analysis/analyze', {
      text: 'i dont want to eat anything'
    });
    console.log('Success:', response.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
    console.error('Error Message:', err.message);
  }
}

test();
