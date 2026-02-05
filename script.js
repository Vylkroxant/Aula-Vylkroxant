const SUPABASE_URL = 'https://jmlchpetsfsvswxpvass.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbGNocGV0c2ZzdnN3eHB2YXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzY4MzEsImV4cCI6MjA4NTgxMjgzMX0.vcflm1nf2_Vab_bfIul6q00DwKuc--_bwHVKg6koGK0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let repository = [];

const rules = {
    'word': ['doc', 'docx', 'dot', 'rtf', 'docm', 'dotx', 'dotm'],
    'excel': ['xls', 'xlsx', 'csv', 'xlsm', 'xltx', 'xltm', 'xlsb', 'xlam'],
    'powerpoint': ['ppt', 'pptx', 'pps', 'ppsx', 'potx', 'potm', 'pptm', 'ppsm'],
    'access': ['accdb', 'mdb', 'accde', 'accdt', 'accdr'],
    'visio': ['vsd', 'vsdx', 'vssx', 'vstx', 'vsdm', 'vssm', 'vstm'],
    'project': ['mpp', 'mpt', 'xml'],
    'publisher': ['pub'],
    'powerbi': ['pbix', 'pbit'],
    'onenote': ['one', 'onetoc2', 'onepkg'],
    'outlook': ['msg', 'pst', 'ost', 'eml'],
    'automate': ['json', 'zip'], 
    'apps': ['msapp', 'zip'],
    'pages': ['html', 'htm', 'url', 'aspx'],
    'tdo': ['txt', 'pdf', 'docx'],
    'forms': ['xlsx', 'csv'],
    'loop': ['loop', 'txt', 'docx'],
    'teams': ['zip', 'pdf', 'docx', 'pptx', 'xlsx'],
    'sharepoint': ['zip', 'aspx', 'pdf'],
    'cpp': ['cpp', 'h', 'hpp', 'c', 'cc', 'cxx', 'ino'],
    'pseint': ['psc'],
    'html': ['html', 'htm', 'xhtml', 'php'],
    'css': ['css', 'scss', 'sass', 'less'],
    'js': ['js', 'json', 'jsx', 'ts', 'tsx', 'vue'],
    'python': ['py', 'pyw', 'ipynb', 'pyc'],
    'java': ['java', 'jar', 'class', 'jsp'],
    'pictures': ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff'],
    'mp3': ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
    'pdf': ['pdf'],
    'archive': ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    'txt': ['txt', 'md', 'log', 'ini', 'yaml', 'yml', 'conf']
};

document.addEventListener('DOMContentLoaded', () => {
    if(typeof lucide !== 'undefined') lucide.createIcons();
    const pinInput = document.getElementById('pinInput');
    if(pinInput) {
        pinInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter') checkPin(); 
        });
    }
});

async function checkPin() {
    const inputPin = document.getElementById('pinInput').value.trim().toUpperCase();
    const lockScreen = document.getElementById('lockScreen');
    const errorMsg = document.getElementById('pinError');
    const btn = document.querySelector('#lockScreen .btn-primary-neon');

    if (inputPin === "") {
        errorMsg.style.display = "block";
        errorMsg.innerText = "INGRESE SU CDI";
        return;
    }

    btn.innerText = "VERIFICANDO...";
    errorMsg.style.display = "none";

    try {
        const { data, error } = await supabaseClient
            .from('estudiantes')
            .select('cdi, nombre')
            .eq('cdi', inputPin)
            .maybeSingle();

        if (data) {
            lockScreen.style.opacity = "0";
            setTimeout(() => {
                lockScreen.style.display = "none";
                initUploadForm(); 
            }, 500);
            loadFilesFromCloud(); 
        } else {
            errorMsg.style.display = "block";
            errorMsg.innerText = "CDI NO AUTORIZADO";
            btn.innerText = "REINTENTAR";
            
            const loginBox = document.querySelector('.lock-box');
            if(loginBox) loginBox.classList.add('shake-animation');
            setTimeout(() => loginBox.classList.remove('shake-animation'), 500);
        }
    } catch (err) {
        btn.innerText = "ERROR DE RED";
        console.error("Error crítico:", err);
    }
}

async function loadFilesFromCloud() {
    const { data, error } = await supabaseClient
        .from('repo_metadata')
        .select('*')
        .order('id', { ascending: false });
    
    if (!error) {
        repository = data || [];
        renderRepo(repository);
    }
}

function renderRepo(data) {
    const grid = document.getElementById('repoGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    data.forEach(file => {
        const iconName = getIcon(file.category);
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
            <div class="file-icon" style="color: var(--primary); filter: drop-shadow(0 0 5px var(--primary));">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="file-info">
                <h3>${file.name}</h3>
                <p>${file.category.toUpperCase()} • ${file.date}</p>
                <small>${file.file_name}</small>
            </div>
            <div style="margin-left: auto; display: flex; gap: 15px; align-items: center;">
                <button onclick="procesarDescargaSegura('${file.file_url}')" class="btn-icon-neon" title="Descargar">
                    <i data-lucide="download"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

let currentDownloadUrl = "";

function procesarDescargaSegura(urlArchivo) {
    currentDownloadUrl = urlArchivo;
    const modal = document.getElementById('downloadModal');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('cdiDownloadInput').focus();
    }
}

async function confirmarDescarga() {
    const cdiInput = document.getElementById('cdiDownloadInput').value.trim().toUpperCase();
    const btn = document.querySelector('.btn-confirm');
    const errorMsg = document.getElementById('downloadError');
    
    if (!cdiInput) return;

    btn.innerText = "VERIFICANDO...";
    if(errorMsg) errorMsg.style.display = 'none';

    try {
        const { data, error } = await supabaseClient
            .from('permisos_descarga') 
            .select('cdi_autorizado')
            .eq('cdi_autorizado', cdiInput)
            .maybeSingle();

        if (data) {
            window.open(currentDownloadUrl, '_blank');
            cerrarModalDescarga();
        } else {
            
            if(errorMsg) {
                errorMsg.innerText = "CDI INVÁLIDO";
                errorMsg.style.display = 'block';
            }
            btn.innerText = "VALIDAR";
        }
    } catch (err) {
        if(errorMsg) {
            errorMsg.innerText = "ERROR DE CONEXIÓN";
            errorMsg.style.display = 'block';
        }
        btn.innerText = "VALIDAR";
    }
}

function cerrarModalDescarga() {
    document.getElementById('downloadModal').style.display = 'none';
    document.getElementById('cdiDownloadInput').value = "";
}

function initUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;

    form.onsubmit = async function(e) {
        e.preventDefault();
        const fileInput = document.getElementById('mainFileInput');
        const fileName = document.getElementById('fileNameInput').value;
        const category = document.getElementById('categorySelect').value;
        const file = fileInput.files[0];
        const alertBox = document.getElementById('validationAlert');

        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        if (rules[category.toLowerCase()] && !rules[category.toLowerCase()].includes(ext)) {
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.innerText = `ERROR: .${ext} no es válido para ${category.toUpperCase()}`;
                setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
            } else { alert("Extensión no válida."); }
            return;
        }

        const submitBtn = e.target.querySelector('.btn-primary-neon');
        submitBtn.innerText = "SUBIENDO...";
        submitBtn.disabled = true;

        const filePath = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const { error: storageError } = await supabaseClient.storage
            .from('repo-files')
            .upload(filePath, file);

        if (storageError) {
            alert("Error: " + storageError.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "GUARDAR ARCHIVO";
            return;
        }

        const { data: urlData } = supabaseClient.storage.from('repo-files').getPublicUrl(filePath);

        const { error: dbError } = await supabaseClient.from('repo_metadata').insert([{
            name: fileName,
            category: category,
            file_name: file.name,
            file_url: urlData.publicUrl,
            storage_path: filePath,
            date: new Date().toLocaleDateString()
        }]);

        if (!dbError) {
            await loadFilesFromCloud();
            closeModal();
        }
        submitBtn.disabled = false;
        submitBtn.innerText = "GUARDAR ARCHIVO";
    };
}

function getIcon(cat) {
    const icons = {
        word: 'file-text', excel: 'sheet', powerpoint: 'presentation', access: 'database',
        visio: 'network', project: 'calendar-range', onenote: 'sticky-note', outlook: 'mail',
        publisher: 'layout', powerbi: 'bar-chart-3', automate: 'zap', apps: 'layout-grid',
        pages: 'globe', tdo: 'check-square', forms: 'list-todo', loop: 'rotate-cw',
        teams: 'users', sharepoint: 'share-2', cpp: 'code-2', pseint: 'terminal',
        html: 'file-code', css: 'palette', js: 'scroll', python: 'terminal-square',
        java: 'coffee', pictures: 'image', mp3: 'music', pdf: 'file-type-2', archive: 'file-archive', txt: 'align-left'
    };
    return icons[cat.toLowerCase()] || 'file-question';
}

function filterRepo(category) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
    const filtered = category === 'all' ? repository : repository.filter(f => f.category.toLowerCase() === category.toLowerCase());
    renderRepo(filtered);
}

function openModal() { document.getElementById('uploadModal').style.display = 'flex'; }
function closeModal() { 
    document.getElementById('uploadModal').style.display = 'none'; 
    document.getElementById('uploadForm').reset();
    document.getElementById('fileLabel').innerText = "Seleccionar Archivo";
}

function updateFileName() {
    const input = document.getElementById('mainFileInput');
    const label = document.getElementById('fileLabel');
    if(input.files[0]) {
        label.innerText = input.files[0].name;
        label.style.color = "var(--primary)";
    }
}

document.addEventListener('contextmenu', e => { e.preventDefault(); showSecurityAlert(); });

document.addEventListener('keydown', e => {
    const forbidden = [
        (e.key === 'F12'), (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')),
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))
    ];
    if (forbidden.some(k => k)) { e.preventDefault(); showSecurityAlert(); }
});

function showSecurityAlert() {
    const alert = document.getElementById('securityAlert');
    if(alert) {
        alert.style.display = 'flex';
        document.querySelector('.security-box').animate([
            { transform: 'translate(1px, 1px) rotate(0deg)' },
            { transform: 'translate(-3px, 0px) rotate(1deg)' },
            { transform: 'translate(3px, 2px) rotate(0deg)' }
        ], { duration: 100, iterations: 5 });
    }
}

setInterval(() => {
    const start = new Date();
    debugger;
    if (new Date() - start > 100) document.body.innerHTML = "<h1 style='color:red;text-align:center;margin-top:20%'>VYLKROXANT: INSPECCIÓN DETECTADA</h1>";
}, 1000);

function showSecurityAlert() {
    const alert = document.getElementById('securityAlert');
    if(alert) alert.style.display = 'flex';
}

function hideSecurityAlert() {
    const alert = document.getElementById('securityAlert');
    if(alert) {
        alert.style.display = 'none';
    }
}
