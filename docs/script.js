const GITHUB_API = 'https://api.github.com/repos/anbuinfosec/roktodan-app';

// Utility function to format file size
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Format date to readable string
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function getAllReleases() {
    try {
        const response = await fetch(`${GITHUB_API}/releases`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching releases:', error);
        return [];
    }
}

async function getLatestRelease() {
    try {
        const response = await fetch(`${GITHUB_API}/releases/latest`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching latest release:', error);
        return null;
    }
}

function getAssetForPlatform(release, platform) {
    switch (platform) {
        case 'android':
            return release.assets.find(a => a.name.endsWith('.apk'));
        case 'windows':
            return release.assets.find(a => a.name.endsWith('.zip') && a.name.includes('windows'));
        case 'macos':
            return release.assets.find(a => a.name.endsWith('.zip') && a.name.includes('macos'));
        case 'linux':
            return release.assets.find(a => a.name.endsWith('.tar.gz'));
        default:
            return null;
    }
}

async function downloadLatest(platform) {
    const release = await getLatestRelease();
    if (!release) {
        alert('Failed to fetch release information. Please try again later.');
        return;
    }

    const asset = getAssetForPlatform(release, platform);
    if (asset) {
        if (platform === 'android') {
            // Show special instructions for Android
            const shouldDownload = confirm(
                'To install this app on Android:\n\n' +
                '1. Tap OK to start the download\n' +
                '2. Open the downloaded APK file\n' +
                '3. If prompted, allow installation from unknown sources\n' +
                '4. Follow the installation prompts\n\n' +
                'Would you like to download now?'
            );
            if (!shouldDownload) return;
        }
        window.location.href = asset.browser_download_url;
    } else {
        alert(`No ${platform} build available in the latest release.`);
    }
}

async function updateUI() {
    const release = await getLatestRelease();
    if (!release) return;

    // Update version info for each platform
    ['android', 'windows', 'macos', 'linux'].forEach(platform => {
        const asset = getAssetForPlatform(release, platform);
        if (asset) {
            document.getElementById(`${platform}-version`).textContent = release.tag_name;
            document.getElementById(`${platform}-size`).textContent = formatSize(asset.size);
        } else {
            document.getElementById(`${platform}-version`).textContent = 'Not available';
            document.getElementById(`${platform}-size`).textContent = '';
        }
    });

    // Update changelog
    const changelogContent = document.getElementById('changelog-content');
    changelogContent.innerHTML = marked.parse(release.body || 'No changelog available');

    // Update auto-detect banner
    const detectedPlatform = detectPlatform();
    if (detectedPlatform) {
        const asset = getAssetForPlatform(release, detectedPlatform);
        if (asset) {
            document.getElementById('auto-detect-banner').classList.remove('hidden');
            document.getElementById('platform-name').textContent = getPlatformName(detectedPlatform);
            document.getElementById('auto-download-button').onclick = () => downloadLatest(detectedPlatform);
        }
    }

    // Update all releases section
    const releases = await getAllReleases();
    const releasesListHtml = releases.map(release => `
        <div class="release-item">
            <div class="release-header">
                <span class="release-title">${release.name || release.tag_name}</span>
                <span class="release-date">${formatDate(release.published_at)}</span>
            </div>
            <div class="release-body">
                ${marked.parse(release.body || 'No release notes available')}
            </div>
            <div class="release-downloads">
                ${['android', 'windows', 'macos', 'linux']
                    .map(platform => {
                        const asset = getAssetForPlatform(release, platform);
                        if (!asset) return '';
                        return `
                            <a href="${asset.browser_download_url}" class="download-item">
                                <img src="images/${platform}.svg" alt="${platform}" class="download-icon">
                                <span>${getPlatformName(platform)}</span>
                                <span class="size">${formatSize(asset.size)}</span>
                            </a>
                        `;
                    })
                    .join('')}
            </div>
        </div>
    `).join('');
    
    document.getElementById('releases-list').innerHTML = releasesListHtml;
}

function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Primary check for Android
    if (/android/i.test(userAgent)) {
        document.body.classList.add('platform-android');
        return 'android';
    }
    // Use navigator.platform for additional Android detection
    if (navigator.platform && /linux armv|aarch64/i.test(navigator.platform)) {
        document.body.classList.add('platform-android');
        return 'android';
    }
    
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    if (/macintosh/i.test(userAgent)) return 'macos';
    if (/windows/i.test(userAgent)) return 'windows';
    if (/linux/i.test(userAgent)) return 'linux';
    return null;
}

function getPlatformName(platform) {
    const names = {
        android: 'Android',
        windows: 'Windows',
        macos: 'macOS',
        linux: 'Linux',
        ios: 'iOS'
    };
    return names[platform] || platform;
}

// Initialize everything when the page loads
window.addEventListener('load', updateUI);
