// 首先安装: npm install socks

const { SocksClient } = require('socks');

async function testSocks5Proxy(host, port, username = null, password = null) {
  const options = {
    proxy: {
      host: host,
      port: port,
      type: 5, // SOCKS5
    },
    command: 'connect',
    destination: {
      host: 'www.google.com', // 测试目标网站
      port: 80
    },
    timeout: 5000 // 5秒超时
  };

  // 如果有用户名密码
  if (username && password) {
    options.proxy.userId = username;
    options.proxy.password = password;
  }

  console.log(`\n测试代理: ${host}:${port}`);
  
  try {
    const info = await SocksClient.createConnection(options);
    console.log(`✓ ${host}:${port} - 代理可用!`);
    info.socket.destroy(); // 关闭连接
    return true;
  } catch (error) {
    console.log(`✗ ${host}:${port} - 代理不可用: ${error.message}`);
    return false;
  }
}


testSocks5Proxy('43.161.218.237', 24001);

testSocks5Proxy('192.227.250.95', 45001, 'nBV68c0ef8f0b3d5', 'fD1vBRCbX9iwPuyero');