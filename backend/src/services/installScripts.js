// Catalog of tools that can be one-click installed on a connected server.
// Scripts target Debian/Ubuntu (apt-based) servers and are written to be
// idempotent - safe to run again if the tool is already installed.

const TOOLS = [
  {
    id: 'docker',
    name: 'Docker',
    description: 'Container runtime for building and running applications.',
    checkCommand: 'command -v docker >/dev/null 2>&1 && docker --version',
    installScript: `
set -e
if command -v docker >/dev/null 2>&1; then
  echo "Docker is already installed:"; docker --version; exit 0
fi
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker --version
`.trim(),
  },
  {
    id: 'nginx',
    name: 'Nginx',
    description: 'High performance web server and reverse proxy.',
    checkCommand: 'command -v nginx >/dev/null 2>&1 && nginx -v',
    installScript: `
set -e
if command -v nginx >/dev/null 2>&1; then
  echo "Nginx is already installed:"; nginx -v; exit 0
fi
sudo apt-get update -y
sudo apt-get install -y nginx
sudo systemctl enable --now nginx
nginx -v
`.trim(),
  },
  {
    id: 'node',
    name: 'Node.js',
    description: 'JavaScript runtime, installed via NodeSource (LTS).',
    checkCommand: 'command -v node >/dev/null 2>&1 && node --version',
    installScript: `
set -e
if command -v node >/dev/null 2>&1; then
  echo "Node.js is already installed:"; node --version; exit 0
fi
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
`.trim(),
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Automation server for CI/CD pipelines.',
    checkCommand: 'command -v jenkins >/dev/null 2>&1 && jenkins --version',
    installScript: `
set -e
if command -v jenkins >/dev/null 2>&1; then
  echo "Jenkins is already installed."; exit 0
fi
sudo apt-get update -y
sudo apt-get install -y fontconfig openjdk-17-jre
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y jenkins
sudo systemctl enable --now jenkins
echo "Jenkins installed. Initial admin password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword || true
`.trim(),
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Version control system.',
    checkCommand: 'command -v git >/dev/null 2>&1 && git --version',
    installScript: `
set -e
if command -v git >/dev/null 2>&1; then
  echo "Git is already installed:"; git --version; exit 0
fi
sudo apt-get update -y
sudo apt-get install -y git
git --version
`.trim(),
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Relational database server.',
    checkCommand: 'command -v psql >/dev/null 2>&1 && psql --version',
    installScript: `
set -e
if command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL is already installed:"; psql --version; exit 0
fi
sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
psql --version
`.trim(),
  },
];

function getTool(id) {
  return TOOLS.find((t) => t.id === id);
}

module.exports = { TOOLS, getTool };
