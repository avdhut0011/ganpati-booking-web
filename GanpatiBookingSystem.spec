# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Base directories
project_dir = os.path.abspath('.')
backend_dir = os.path.join(project_dir, 'backend')
frontend_dist = os.path.join(project_dir, 'frontend', 'dist')
env_file = os.path.join(backend_dir, '.env')

datas = [
    (frontend_dist, 'frontend_dist'),
    (os.path.join(backend_dir, 'app'), 'app'),
]

if os.path.exists(env_file):
    datas.append((env_file, '.'))

# Collect xhtml2pdf data files if any font files are included
datas += collect_data_files('xhtml2pdf')
datas += collect_data_files('reportlab')

hidden_imports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'sqlalchemy.dialects.sqlite',
    'xhtml2pdf',
    'xhtml2pdf.pisa',
    'reportlab',
    'pydantic',
    'pydantic_settings',
    'bcrypt',
    'python-jose',
    'jose',
    'jose.jwt',
    'aiofiles',
]

hidden_imports += collect_submodules('xhtml2pdf')
hidden_imports += collect_submodules('reportlab')

a = Analysis(
    [os.path.join(backend_dir, 'run.py')],
    pathex=[backend_dir],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='GanpatiBookingSystem',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
