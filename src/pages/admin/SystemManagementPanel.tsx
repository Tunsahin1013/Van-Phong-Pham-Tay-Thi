import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, DatabaseBackup, Download, FileSpreadsheet,
  RefreshCw, Save, Settings2, ShieldAlert, CalendarDays, Search, ExternalLink,
  Package, Users, Move, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getStoredToken, systemAPI, StoreSettingsData, ProductInventoryReportData, CustomerInsightsReportData } from '../../api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E3E1', borderRadius: 12, padding: 22,
  boxShadow: '0 4px 18px rgba(16,16,16,.04)', minWidth: 0,
};
const primaryButton: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 6, border: '1px solid #D90D24',
  background: '#F21D2F', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
};
const secondaryButton: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB',
  background: '#fff', color: '#202124', fontWeight: 650, cursor: 'pointer', fontSize: 13,
};
const fieldStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB',
  borderRadius: 6, color: '#101010', background: '#fff', fontSize: 13,
};

const defaultSettings: StoreSettingsData = {
  storeName: 'Văn phòng phẩm Tây Thi',
  logoUrl: '',
  hotline: '1900 6868',
  address: '10 Ngõ 226 Cầu Giấy, Nghĩa Đô, Cầu Giấy, Hà Nội',
  email: 'lienhe@stationery.vn',
};

type SystemLog = {
  id: string; actorId?: string; actorName: string; actorRole: string; action: string;
  method: string; path: string; statusCode: number; ip?: string;
  details?: string; createdAt: string;
};

async function downloadAdminFile(endpoint: string, fallbackName: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = `Tải tệp thất bại (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch { /* response may not be JSON */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] || fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export const SystemManagementPanel: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<StoreSettingsData>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportType, setReportType] = useState<'orders' | 'revenue'>('orders');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logStatus, setLogStatus] = useState('ALL');
  const [productReport, setProductReport] = useState<ProductInventoryReportData | null>(null);
  const [productReportLoading, setProductReportLoading] = useState(false);
  const [productReportDays, setProductReportDays] = useState(30);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [slowMovingThreshold, setSlowMovingThreshold] = useState(2);
  // Two inline report boards can be reordered by dragging their headers.
  // They remain in the normal page layout; there is no fixed/floating window.
  const [reportBoardOrder, setReportBoardOrder] = useState<'low-stock' | 'slow-moving'>('low-stock');
  const [slowMovingCollapsed, setSlowMovingCollapsed] = useState(false);
  const reportBoardDragRef = useRef<'low-stock' | 'slow-moving' | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerInsightsReportData | null>(null);
  const [customerReportLoading, setCustomerReportLoading] = useState(false);
  const [customerReportDays, setCustomerReportDays] = useState(30);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const result = await systemAPI.getSettings();
      if (result.success && result.data) setSettings({ ...defaultSettings, ...result.data });
    } catch (error: any) {
      showToast(error?.message || 'Không tải được cấu hình cửa hàng', 'error');
    } finally {
      setSettingsLoading(false);
    }
  }, [showToast]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const result = await systemAPI.getLogs({ limit: 200, q: logSearch.trim(), status: logStatus });
      if (result.success) setLogs(result.data || []);
    } catch (error: any) {
      showToast(error?.message || 'Không tải được nhật ký hệ thống', 'error');
    } finally {
      setLogsLoading(false);
    }
  }, [logSearch, logStatus, showToast]);

  const loadProductInventoryReport = useCallback(async (params: { days?: number; lowStockThreshold?: number; slowMovingThreshold?: number } = {}) => {
    setProductReportLoading(true);
    try {
      const result = await systemAPI.getProductInventoryReport({
        days: params.days ?? 30,
        lowStockThreshold: params.lowStockThreshold ?? 10,
        slowMovingThreshold: params.slowMovingThreshold ?? 2,
      });
      if (result.success) setProductReport(result.data);
    } catch (error: any) {
      showToast(error?.message || 'Không tải được báo cáo sản phẩm bán chậm và sắp hết hàng', 'error');
    } finally {
      setProductReportLoading(false);
    }
  }, [showToast]);

  const loadCustomerInsightsReport = useCallback(async (days = 30) => {
    setCustomerReportLoading(true);
    try {
      const result = await systemAPI.getCustomerInsightsReport({ days, limit: 20 });
      if (result.success) setCustomerReport(result.data);
    } catch (error: any) {
      showToast(error?.message || 'Không tải được báo cáo khách hàng', 'error');
    } finally {
      setCustomerReportLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadSettings(); }, [loadSettings]);
  useEffect(() => { void loadLogs(); }, [loadLogs]);
  useEffect(() => { void loadProductInventoryReport(); }, [loadProductInventoryReport]);
  useEffect(() => { void loadCustomerInsightsReport(); }, [loadCustomerInsightsReport]);

  const startReportBoardDrag = (board: 'low-stock' | 'slow-moving') => (event: React.DragEvent<HTMLDivElement>) => {
    reportBoardDragRef.current = board;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', board);
  };

  const allowReportBoardDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const dropReportBoard = (target: 'low-stock' | 'slow-moving') => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const source = reportBoardDragRef.current || event.dataTransfer.getData('text/plain');
    if ((source === 'low-stock' || source === 'slow-moving') && source !== target) {
      setReportBoardOrder(source);
    }
    reportBoardDragRef.current = null;
  };

  const endReportBoardDrag = () => { reportBoardDragRef.current = null; };

  const logStats = useMemo(() => ({
    total: logs.length,
    errors: logs.filter(log => log.statusCode >= 400).length,
    admins: new Set(logs.filter(log => log.actorRole === 'ADMIN').map(log => log.actorId || log.actorName)).size,
  }), [logs]);

  const handleBackup = async () => {
    const approved = window.confirm(
      'Tệp sao lưu có thể chứa dữ liệu khách hàng và hash mật khẩu. Chỉ lưu tệp ở nơi an toàn. Bạn muốn tải bản sao lưu JSON xuống máy không?'
    );
    if (!approved) return;
    setBackupLoading(true);
    try {
      await downloadAdminFile('/api/system/backup', 'tay-thi-backup.json');
      showToast('Đã tải bản sao lưu JSON xuống máy.', 'success');
      void loadLogs();
    } catch (error: any) {
      showToast(error?.message || 'Không thể tạo bản sao lưu', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc.', 'error');
      return;
    }
    const params = new URLSearchParams({ type: reportType });
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    setExportLoading(true);
    try {
      await downloadAdminFile(`/api/system/reports/export?${params.toString()}`, `tay-thi-${reportType}.csv`);
      showToast(`Đã xuất báo cáo ${reportType === 'revenue' ? 'doanh thu' : 'đơn hàng'} dạng CSV.`, 'success');
      void loadLogs();
    } catch (error: any) {
      showToast(error?.message || 'Không thể xuất báo cáo', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSettingsSaving(true);
    try {
      const result = await systemAPI.updateSettings(settings);
      if (result.success) {
        setSettings({ ...defaultSettings, ...result.data });
        showToast('Đã lưu cấu hình thông tin cửa hàng.', 'success');
      }
    } catch (error: any) {
      showToast(error?.message || 'Không thể lưu cấu hình cửa hàng', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const field = (label: string, key: keyof StoreSettingsData, options?: { type?: string; placeholder?: string; required?: boolean }) => (
    <label style={{ display: 'block', marginBottom: 14 }} key={key}>
      <span style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 700 }}>{label}</span>
      <input
        style={fieldStyle}
        type={options?.type || 'text'}
        value={settings[key] || ''}
        placeholder={options?.placeholder || ''}
        required={options?.required ?? true}
        maxLength={key === 'logoUrl' ? 2048 : key === 'address' ? 250 : key === 'storeName' ? 100 : 120}
        onChange={(event) => setSettings(previous => ({ ...previous, [key]: event.target.value }))}
      />
    </label>
  );

  const renderLowStockBoard = () => (
    <section
      key="low-stock-board"
      onDragOver={allowReportBoardDrop}
      onDrop={dropReportBoard('low-stock')}
      style={{ minWidth: 0, border: '1px solid #D1D5DB', borderRadius: 10, background: '#FFFFFF', overflow: 'hidden' }}
      aria-label="Bảng sản phẩm sắp hết hàng"
    >
      <div
        draggable
        onDragStart={startReportBoardDrag('low-stock')}
        onDragEnd={endReportBoardDrag}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', background: '#101010', color: '#FFFFFF', borderBottom: '3px solid #F21D2F', cursor: 'grab', userSelect: 'none' }}
        title="Giữ và kéo để đổi vị trí bảng trong khu vực US72"
      >
        <Move size={16} color="#F21D2F" />
        <div style={{ minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: 14, color: '#FFFFFF' }}>Sản phẩm sắp hết hàng</h4>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#D1D5DB' }}>Kéo thanh tiêu đề để đổi vị trí với bảng bán chậm</p>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#777B80' }}>Tồn kho hiện tại thấp hơn hoặc bằng ngưỡng đã chọn; sắp xếp tồn thấp trước.</p>
        <div style={{ maxHeight: 330, overflow: 'auto', border: '1px solid #E2E3E1', borderRadius: 8 }}>
          <table className="data-table" style={{ minWidth: 590, width: '100%' }}>
            <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Tồn</th><th>Đã bán trong kỳ</th></tr></thead>
            <tbody>
              {productReportLoading && !productReport ? <tr><td colSpan={4} style={{ padding: 18, textAlign: 'center' }}>Đang tải…</td></tr> : !productReport?.lowStockProducts.length ? <tr><td colSpan={4} style={{ padding: 18, textAlign: 'center', color: '#777B80' }}>Không có sản phẩm dưới ngưỡng tồn kho.</td></tr> : productReport.lowStockProducts.map(product => <tr key={product.productId}>
                <td><strong>{product.name}</strong><div style={{ fontSize: 11, color: '#777B80' }}>{product.code}{product.brand ? ` · ${product.brand}` : ''}</div></td>
                <td>{product.categoryName || '—'}</td>
                <td><span style={{ color: product.stock === 0 ? '#991B1B' : '#B91C1C', fontWeight: 800 }}>{product.stock}</span></td>
                <td>{product.soldInPeriod}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const renderSlowMovingBoard = () => (
    <section
      key="slow-moving-board"
      onDragOver={allowReportBoardDrop}
      onDrop={dropReportBoard('slow-moving')}
      style={{ minWidth: 0, border: '1px solid #D1D5DB', borderRadius: 10, background: '#FFFFFF', overflow: 'hidden' }}
      aria-label="Bảng sản phẩm bán chậm"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', background: '#101010', color: '#FFFFFF', borderBottom: '3px solid #F21D2F' }}>
        <div
          draggable
          onDragStart={startReportBoardDrag('slow-moving')}
          onDragEnd={endReportBoardDrag}
          style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, cursor: 'grab', userSelect: 'none' }}
          title="Giữ và kéo để đổi vị trí bảng trong khu vực US72"
        >
          <Move size={16} color="#F21D2F" />
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: '#FFFFFF' }}>Sản phẩm bán chậm</h4>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#D1D5DB' }}>{productReport?.slowMovingProducts.length ?? 0} sản phẩm · Kéo để đổi vị trí bảng</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={!slowMovingCollapsed}
          aria-label={slowMovingCollapsed ? 'Mở rộng bảng sản phẩm bán chậm' : 'Thu gọn bảng sản phẩm bán chậm'}
          title={slowMovingCollapsed ? 'Mở rộng bảng' : 'Thu gọn bảng'}
          onClick={() => setSlowMovingCollapsed(value => !value)}
          style={{ width: 30, height: 30, flexShrink: 0, display: 'grid', placeItems: 'center', border: '1px solid #4B5563', borderRadius: 6, background: '#202124', color: '#FFFFFF', cursor: 'pointer' }}
        >
          {slowMovingCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
      {!slowMovingCollapsed && <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, color: '#777B80', fontSize: 11 }}>
          <span>Bán ≤ {slowMovingThreshold} sản phẩm trong {productReportDays} ngày · Loại trừ sản phẩm hết hàng</span>
          <button type="button" style={{ ...secondaryButton, padding: '5px 8px', fontSize: 11 }} disabled={productReportLoading} onClick={() => void loadProductInventoryReport({ days: productReportDays, lowStockThreshold, slowMovingThreshold })}>
            <RefreshCw size={13} className={productReportLoading ? 'system-spin' : ''} /> Làm mới
          </button>
        </div>
        <div style={{ maxHeight: 330, overflow: 'auto', border: '1px solid #E2E3E1', borderRadius: 8 }}>
          <table className="data-table" style={{ minWidth: 590, width: '100%' }}>
            <thead><tr><th>Sản phẩm</th><th>Tồn</th><th>Đã bán</th><th>Lần bán gần nhất</th></tr></thead>
            <tbody>
              {productReportLoading && !productReport ? <tr><td colSpan={4} style={{ padding: 18, textAlign: 'center' }}>Đang tải…</td></tr> : !productReport?.slowMovingProducts.length ? <tr><td colSpan={4} style={{ padding: 18, textAlign: 'center', color: '#777B80' }}>Không có sản phẩm bán chậm theo ngưỡng đã chọn.</td></tr> : productReport.slowMovingProducts.map(product => <tr key={product.productId}>
                <td><strong>{product.name}</strong><div style={{ fontSize: 11, color: '#777B80' }}>{product.code}</div></td>
                <td>{product.stock}</td>
                <td><strong style={{ color: '#B45309' }}>{product.soldInPeriod}</strong></td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{product.lastSoldAt ? formatDate(product.lastSoldAt) : 'Chưa ghi nhận'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>}
    </section>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#FFE5E8', color: '#D90D24' }}><DatabaseBackup size={21} /></div>
            <div><h3 style={{ margin: 0, fontSize: 16 }}>US75 · Sao lưu dữ liệu</h3><span style={{ color: '#777B80', fontSize: 12 }}>Tải bản sao lưu JSON</span></div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#5f5e5e', marginBottom: 16 }}>
            Xuất ảnh chụp dữ liệu ứng dụng đang sử dụng để lưu trữ ngoại tuyến. Bản sao lưu có thể chứa thông tin cá nhân và hash mật khẩu; bảo quản tệp cẩn thận.
          </p>
          <button style={primaryButton} disabled={backupLoading} onClick={handleBackup}>
            {backupLoading ? <RefreshCw size={16} className="system-spin" /> : <Download size={16} />}
            {backupLoading ? 'Đang tạo tệp…' : 'Tải bản sao lưu'}
          </button>
        </section>

        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#F3F4F6', color: '#202124' }}><FileSpreadsheet size={21} /></div>
            <div><h3 style={{ margin: 0, fontSize: 16 }}>US76 · Xuất báo cáo</h3><span style={{ color: '#777B80', fontSize: 12 }}>CSV · Excel có thể mở trực tiếp</span></div>
          </div>
          <form onSubmit={handleExport}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 700 }}>Loại báo cáo</label>
            <select value={reportType} onChange={e => setReportType(e.target.value as 'orders' | 'revenue')} style={{ ...fieldStyle, marginBottom: 12 }}>
              <option value="orders">Báo cáo đơn hàng</option>
              <option value="revenue">Báo cáo doanh thu (đơn hoàn thành)</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ fontSize: 12, color: '#5f5e5e' }}>Từ ngày<input style={{ ...fieldStyle, marginTop: 5 }} type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
              <label style={{ fontSize: 12, color: '#5f5e5e' }}>Đến ngày<input style={{ ...fieldStyle, marginTop: 5 }} type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
            </div>
            <button type="submit" style={{ ...primaryButton, marginTop: 14 }} disabled={exportLoading}>
              {exportLoading ? <RefreshCw size={16} className="system-spin" /> : <Download size={16} />}
              {exportLoading ? 'Đang xuất…' : 'Xuất file CSV'}
            </button>
          </form>
        </section>

        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#FEE2E2', color: '#B91C1C' }}><Activity size={21} /></div>
            <div><h3 style={{ margin: 0, fontSize: 16 }}>US77 · Nhật ký hoạt động</h3><span style={{ color: '#777B80', fontSize: 12 }}>Các thao tác và yêu cầu lỗi gần đây</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '16px 0' }}>
            {[['Bản ghi', logStats.total], ['Lỗi HTTP', logStats.errors], ['Admin hoạt động', logStats.admins]].map(([label, value]) => (
              <div key={label} style={{ padding: 10, borderRadius: 8, background: '#F5F5F3' }}>
                <div style={{ color: '#777B80', fontSize: 11 }}>{label}</div>
                <strong style={{ color: label === 'Lỗi HTTP' && Number(value) > 0 ? '#D90D24' : '#101010', fontSize: 20 }}>{value}</strong>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#5f5e5e', marginBottom: 14 }}>Nhật ký không ghi nội dung request, mật khẩu hay token. Hệ thống lưu tối đa 2.000 bản ghi gần nhất.</p>
          <button style={secondaryButton} onClick={() => void loadLogs()} disabled={logsLoading}><RefreshCw size={15} /> Làm mới nhật ký</button>
        </section>
      </div>

      <section style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 9, background: '#FFE5E8', color: '#D90D24' }}><Package size={22} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>US72 · Báo cáo sản phẩm bán chậm và sắp hết</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#777B80' }}>Dữ liệu theo đơn đã hoàn thành, không dùng số liệu bán giả lập.</p>
            </div>
          </div>
          <button type="button" style={secondaryButton} disabled={productReportLoading} onClick={() => void loadProductInventoryReport({ days: productReportDays, lowStockThreshold, slowMovingThreshold })}>
            <RefreshCw size={15} className={productReportLoading ? 'system-spin' : ''} /> {productReportLoading ? 'Đang cập nhật…' : 'Cập nhật báo cáo'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, padding: 14, background: '#F5F5F3', borderRadius: 9, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#444', fontWeight: 700 }}>Kỳ tính bán hàng
            <select style={{ ...fieldStyle, marginTop: 6 }} value={productReportDays} onChange={e => setProductReportDays(Number(e.target.value))}>
              <option value={7}>7 ngày gần nhất</option><option value={30}>30 ngày gần nhất</option><option value={60}>60 ngày gần nhất</option><option value={90}>90 ngày gần nhất</option>
            </select>
          </label>
          <label style={{ fontSize: 12, color: '#444', fontWeight: 700 }}>Ngưỡng sắp hết hàng (tồn ≤)
            <input type="number" min={0} max={100000} style={{ ...fieldStyle, marginTop: 6 }} value={lowStockThreshold} onChange={e => setLowStockThreshold(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))} />
          </label>
          <label style={{ fontSize: 12, color: '#444', fontWeight: 700 }}>Ngưỡng bán chậm (bán ≤)
            <input type="number" min={0} max={100000} style={{ ...fieldStyle, marginTop: 6 }} value={slowMovingThreshold} onChange={e => setSlowMovingThreshold(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))} />
          </label>
        </div>

        {productReport && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
          {[
            ['Sản phẩm đang kinh doanh', productReport.summary.activeProducts, '#202124'],
            ['Sắp hết hàng', productReport.summary.lowStockCount, '#D90D24'],
            ['Hết hàng', productReport.summary.outOfStockCount, '#991B1B'],
            ['Bán chậm', productReport.summary.slowMovingCount, '#B45309'],
          ].map(([label, value, color]) => <div key={String(label)} style={{ padding: 13, border: '1px solid #E2E3E1', borderRadius: 9 }}>
            <div style={{ fontSize: 12, color: '#777B80', marginBottom: 5 }}>{label}</div><strong style={{ fontSize: 24, color: String(color) }}>{Number(value).toLocaleString('vi-VN')}</strong>
          </div>)}
        </div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16, alignItems: 'start' }}>
          {reportBoardOrder === 'low-stock' ? renderLowStockBoard() : renderSlowMovingBoard()}
          {reportBoardOrder === 'low-stock' ? renderSlowMovingBoard() : renderLowStockBoard()}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#777B80' }}>Báo cáo tính số lượng từ các đơn có trạng thái Hoàn thành và chưa hoàn tiền. Danh sách hiển thị tối đa 200 sản phẩm mỗi nhóm.</p>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 9, background: '#FFE5E8', color: '#D90D24' }}><Users size={22} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17 }}>US73 · Báo cáo khách hàng mới và khách hàng mua nhiều</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#777B80' }}>Khách mới theo thời gian đăng ký; khách mua nhiều xếp theo số đơn hoàn thành và tổng chi tiêu.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <select aria-label="Khoảng thời gian khách hàng mới" value={customerReportDays} onChange={e => setCustomerReportDays(Number(e.target.value))} style={{ ...fieldStyle, width: 170 }}>
              <option value={7}>7 ngày gần nhất</option><option value={30}>30 ngày gần nhất</option><option value={90}>90 ngày gần nhất</option><option value={180}>180 ngày gần nhất</option><option value={365}>365 ngày gần nhất</option>
            </select>
            <button type="button" style={secondaryButton} disabled={customerReportLoading} onClick={() => void loadCustomerInsightsReport(customerReportDays)}>
              <RefreshCw size={15} className={customerReportLoading ? 'system-spin' : ''} /> {customerReportLoading ? 'Đang tải…' : 'Cập nhật'}
            </button>
          </div>
        </div>

        {customerReport && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
          <div style={{ padding: 13, border: '1px solid #E2E3E1', borderRadius: 9 }}><div style={{ fontSize: 12, color: '#777B80', marginBottom: 5 }}>Khách hàng mới trong {customerReportDays} ngày</div><strong style={{ fontSize: 24, color: '#D90D24' }}>{customerReport.summary.newCustomerCount.toLocaleString('vi-VN')}</strong></div>
          <div style={{ padding: 13, border: '1px solid #E2E3E1', borderRadius: 9 }}><div style={{ fontSize: 12, color: '#777B80', marginBottom: 5 }}>Khách có đơn hoàn thành</div><strong style={{ fontSize: 24, color: '#101010' }}>{customerReport.summary.customersWithCompletedOrders.toLocaleString('vi-VN')}</strong></div>
        </div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Khách hàng mới</h4>
            <div style={{ overflowX: 'auto', border: '1px solid #E2E3E1', borderRadius: 8 }}>
              <table className="data-table" style={{ minWidth: 650, width: '100%' }}>
                <thead><tr><th>Khách hàng</th><th>Ngày đăng ký</th><th>Đơn hoàn thành</th><th>Chi tiêu</th></tr></thead>
                <tbody>
                  {customerReportLoading && !customerReport ? <tr><td colSpan={4} style={{ padding: 18, textAlign: 'center' }}>Đang tải…</td></tr> : !customerReport?.newCustomers.length ? <tr><td colSpan={4} style={{ padding: 18, textAlign: 'center', color: '#777B80' }}>Không có khách mới trong khoảng thời gian này.</td></tr> : customerReport.newCustomers.map(customer => <tr key={customer.id}>
                    <td><strong>{customer.name}</strong><div style={{ fontSize: 11, color: '#777B80' }}>{customer.email}{customer.phone ? ` · ${customer.phone}` : ''}</div></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(customer.createdAt)}</td><td>{customer.completedOrderCount}</td><td>{formatMoney(customer.totalSpent)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Khách hàng mua nhiều · Top 20</h4>
            <div style={{ overflowX: 'auto', border: '1px solid #E2E3E1', borderRadius: 8 }}>
              <table className="data-table" style={{ minWidth: 650, width: '100%' }}>
                <thead><tr><th>#</th><th>Khách hàng</th><th>Đơn hoàn thành</th><th>Tổng chi tiêu</th><th>Lần mua gần nhất</th></tr></thead>
                <tbody>
                  {customerReportLoading && !customerReport ? <tr><td colSpan={5} style={{ padding: 18, textAlign: 'center' }}>Đang tải…</td></tr> : !customerReport?.frequentCustomers.length ? <tr><td colSpan={5} style={{ padding: 18, textAlign: 'center', color: '#777B80' }}>Chưa có khách hàng có đơn hoàn thành.</td></tr> : customerReport.frequentCustomers.map((customer, index) => <tr key={customer.id}>
                    <td><strong>{index + 1}</strong></td><td><strong>{customer.name}</strong><div style={{ fontSize: 11, color: '#777B80' }}>{customer.email}</div></td><td><strong>{customer.completedOrderCount}</strong></td><td>{formatMoney(customer.totalSpent)}</td><td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#777B80' }}>Khách hàng mới được tính theo ngày tạo tài khoản. Khách mua nhiều được xếp hạng theo số đơn hoàn thành chưa hoàn tiền trong toàn bộ lịch sử lưu tại DataStore; tổng chi tiêu chỉ tính các đơn đó.</p>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#FFE5E8', color: '#D90D24' }}><Settings2 size={22} /></div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>US78 · Cấu hình thông tin cửa hàng</h3>
            <p style={{ margin: '4px 0 0', color: '#777B80', fontSize: 12 }}>Thông tin được cung cấp cho Header/Footer của website công khai.</p>
          </div>
        </div>
        {settingsLoading ? <p style={{ color: '#777B80' }}>Đang tải cấu hình…</p> : (
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 18px' }}>
              {field('Tên cửa hàng *', 'storeName', { required: true, placeholder: 'Văn phòng phẩm Tây Thi' })}
              {field('Hotline *', 'hotline', { required: true, placeholder: '1900 6868' })}
              {field('URL hoặc đường dẫn logo', 'logoUrl', { required: false, placeholder: 'https://... hoặc /images/logo.png' })}
              {field('Email liên hệ', 'email', { required: false, type: 'email', placeholder: 'lienhe@example.com' })}
            </div>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 6, color: '#333', fontSize: 13, fontWeight: 700 }}>Địa chỉ cửa hàng *</span>
              <textarea value={settings.address || ''} required maxLength={250} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} onChange={e => setSettings(previous => ({ ...previous, address: e.target.value }))} />
            </label>
            {settings.logoUrl && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#F5F5F3', borderRadius: 8 }}>
                <img src={settings.logoUrl} alt="Xem trước logo cửa hàng" style={{ maxWidth: 150, maxHeight: 56, objectFit: 'contain' }} onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                <span style={{ fontSize: 12, color: '#5f5e5e' }}>Xem trước logo. Dùng URL HTTPS hoặc đường dẫn ảnh trong thư mục public.</span>
              </div>
            )}
            <button type="submit" style={primaryButton} disabled={settingsSaving || settingsLoading}>
              {settingsSaving ? <RefreshCw size={16} className="system-spin" /> : <Save size={16} />}
              {settingsSaving ? 'Đang lưu…' : 'Lưu cấu hình cửa hàng'}
            </button>
            {settings.updatedAt && <span style={{ marginLeft: 12, color: '#777B80', fontSize: 12 }}>Cập nhật lần cuối: {formatDate(settings.updatedAt)} bởi {settings.updatedBy || '—'}</span>}
          </form>
        )}
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 17 }}>Nhật ký hệ thống</h3><p style={{ margin: '4px 0 0', fontSize: 12, color: '#777B80' }}>Hiển thị tối đa 200 bản ghi gần đây.</p></div>
          <button style={secondaryButton} onClick={() => void loadLogs()} disabled={logsLoading}><RefreshCw size={15} /> Tải lại</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <label style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#777B80' }} />
            <input style={{ ...fieldStyle, paddingLeft: 34 }} value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Tìm người thao tác, hành động, API…" />
          </label>
          <select style={{ ...fieldStyle, width: 180 }} value={logStatus} onChange={e => setLogStatus(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option><option value="200">HTTP 200</option><option value="201">HTTP 201</option><option value="400">HTTP 400</option><option value="401">HTTP 401</option><option value="403">HTTP 403</option><option value="500">HTTP 500</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 12, marginBottom: 14, border: '1px solid #FDE68A', borderRadius: 8, background: '#FFFBEB', color: '#92400E', fontSize: 12 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          Log phản ánh các thao tác thay đổi dữ liệu, tải sao lưu/xuất báo cáo và một số yêu cầu lỗi. Không ghi nội dung biểu mẫu, mật khẩu hoặc token.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 900, width: '100%' }}>
            <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Yêu cầu</th><th>HTTP</th><th>IP</th></tr></thead>
            <tbody>
              {logsLoading ? <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center' }}>Đang tải nhật ký…</td></tr> : logs.length === 0 ? <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#777B80' }}>Chưa có bản ghi phù hợp.</td></tr> : logs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(log.createdAt)}</td>
                  <td><strong>{log.actorName}</strong><div style={{ fontSize: 11, color: '#777B80' }}>{log.actorRole}</div></td>
                  <td><strong>{log.action}</strong>{log.details && <div style={{ fontSize: 11, color: '#777B80', maxWidth: 260 }}>{log.details}</div>}</td>
                  <td><code>{log.method} {log.path}</code></td>
                  <td><span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 800, color: log.statusCode >= 400 ? '#B91C1C' : '#047857', background: log.statusCode >= 400 ? '#FEE2E2' : '#D1FAE5' }}>{log.statusCode}</span></td>
                  <td style={{ fontSize: 12, color: '#5f5e5e' }}>{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ color: '#777B80', display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.6 }}>
        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
        <span>Quyền truy cập các chức năng này chỉ dành cho ADMIN. Bản sao lưu tải về nên được lưu ngoài thư mục mã nguồn, không commit hoặc tải công khai lên GitHub.</span>
      </div>

    </div>
  );
};
