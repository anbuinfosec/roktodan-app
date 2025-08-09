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
        if (!response.ok) {
            console.error('Failed to fetch releases:', response.statusText);
            return [];
        }
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
        if (!response.ok) {
            console.error('Failed to fetch latest release:', response.statusText);
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching latest release:', error);
        return null;
    }
}

function getAssetForPlatform(release, platform) {
    if (!release || !release.assets) return null;

    switch (platform) {
        case 'android':
            return release.assets.find(a => a.name.endsWith('.apk'));
        case 'macos':
            // Support .app bundle, zipped .zip, or .dmg installers
            return release.assets.find(a =>
                a.name.endsWith('.app') || a.name.endsWith('.zip') || a.name.endsWith('.dmg')
            );
        case 'linux':
            // Support .deb, .tar.gz, .AppImage, .zip etc
            return release.assets.find(a =>
                a.name.endsWith('.deb') ||
                a.name.endsWith('.tar.gz') ||
                a.name.endsWith('.AppImage') ||
                a.name.endsWith('.zip')
            );
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
    ['android', 'linux', 'macos'].forEach(platform => {
        const asset = getAssetForPlatform(release, platform);
        const versionElem = document.getElementById(`${platform}-version`);
        const sizeElem = document.getElementById(`${platform}-size`);
        if (asset) {
            if (versionElem) versionElem.textContent = release.tag_name;
            if (sizeElem) sizeElem.textContent = formatSize(asset.size);
        } else {
            if (versionElem) versionElem.textContent = 'Not available';
            if (sizeElem) sizeElem.textContent = '';
        }
    });

    // Update changelog
    const changelogContent = document.getElementById('changelog-content');
    if (changelogContent) {
        changelogContent.innerHTML = marked.parse(release.body || 'No changelog available');
    }

    // Update auto-detect banner
    const detectedPlatform = detectPlatform();
    if (detectedPlatform) {
        const asset = getAssetForPlatform(release, detectedPlatform);
        if (asset) {
            const banner = document.getElementById('auto-detect-banner');
            if (banner) banner.classList.remove('hidden');
            const platformNameElem = document.getElementById('platform-name');
            if (platformNameElem) platformNameElem.textContent = getPlatformName(detectedPlatform);
            const autoDownloadBtn = document.getElementById('auto-download-button');
            if (autoDownloadBtn) {
                autoDownloadBtn.onclick = () => downloadLatest(detectedPlatform);
            }
        }
    }

    // Update all releases section
    const releases = await getAllReleases();
    if (!releases || !Array.isArray(releases)) return;

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
                ${['android', 'linux', 'macos'].map(platform => {
                    const asset = getAssetForPlatform(release, platform);
                    if (!asset) return '';
                    return `
                        <a href="${asset.browser_download_url}" class="download-item" target="_blank" rel="noopener noreferrer">
                            <img src="images/${platform}.svg" alt="${platform}" class="download-icon">
                            <span>${getPlatformName(platform)}</span>
                            <span class="size">${formatSize(asset.size)}</span>
                        </a>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');

    const releasesListElem = document.getElementById('releases-list');
    if (releasesListElem) releasesListElem.innerHTML = releasesListHtml;
}

function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();

    // Primary check for Android
    if (/android/i.test(userAgent)) {
        document.body.classList.add('platform-android');
        return 'android';
    }
    // Additional Android detection from platform string
    if (navigator.platform && /linux armv|aarch64/i.test(navigator.platform)) {
        document.body.classList.add('platform-android');
        return 'android';
    }

    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
    if (/macintosh/i.test(userAgent)) return 'macos';
    if (/linux/i.test(userAgent)) return 'linux';
    return null;
}

function getPlatformName(platform) {
    const names = {
        android: 'Android',
        linux: 'Linux',
        macos: 'macOS',
        ios: 'iOS'
    };
    return names[platform] || platform;
}

// Initialize everything when the page loads
window.addEventListener('load', updateUI);
