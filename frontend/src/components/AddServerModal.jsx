import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useServers } from '../context/ServerContext';
import './AddServerModal.css';

const initialForm = {
  name: '',
  host: '',
  port: '22',
  username: 'root',
  authType: 'password',
  password: '',
  privateKey: '',
  passphrase: '',
  sudoPassword: '',
};

export default function AddServerModal({ onClose }) {
  const { addServer } = useServers();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addServer({ ...form, port: Number(form.port) || 22 });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Connect a server" onClose={onClose} width={460}>
      <form className="sm-form" onSubmit={handleSubmit}>
        <label className="sm-field">
          <span>Display name</span>
          <input value={form.name} onChange={update('name')} placeholder="prod-web-01" required />
        </label>

        <div className="sm-field-row">
          <label className="sm-field" style={{ flex: 2 }}>
            <span>Host or IP</span>
            <input value={form.host} onChange={update('host')} placeholder="192.168.1.10" required />
          </label>
          <label className="sm-field" style={{ flex: 1 }}>
            <span>Port</span>
            <input value={form.port} onChange={update('port')} placeholder="22" />
          </label>
        </div>

        <label className="sm-field">
          <span>Username</span>
          <input value={form.username} onChange={update('username')} placeholder="root" required />
        </label>

        <div className="sm-tabs sm-tabs--compact">
          <button
            type="button"
            className={`sm-tab ${form.authType === 'password' ? 'sm-tab--active' : ''}`}
            onClick={() => setForm((f) => ({ ...f, authType: 'password' }))}
          >
            Password
          </button>
          <button
            type="button"
            className={`sm-tab ${form.authType === 'key' ? 'sm-tab--active' : ''}`}
            onClick={() => setForm((f) => ({ ...f, authType: 'key' }))}
          >
            SSH key
          </button>
        </div>

        {form.authType === 'password' ? (
          <label className="sm-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              required
            />
          </label>
        ) : (
          <>
            <label className="sm-field">
              <span>Private key</span>
              <textarea
                className="mono"
                rows={5}
                value={form.privateKey}
                onChange={update('privateKey')}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                required
              />
            </label>
            <label className="sm-field">
              <span>Passphrase (optional)</span>
              <input
                type="password"
                value={form.passphrase}
                onChange={update('passphrase')}
                placeholder="Leave blank if none"
              />
            </label>
          </>
        )}

        <label className="sm-field">
          <span>Sudo password (optional)</span>
          <input
            type="password"
            value={form.sudoPassword}
            onChange={update('sudoPassword')}
            placeholder={
              form.authType === 'password'
                ? 'Defaults to the password above'
                : 'Required if this account needs one for sudo'
            }
          />
        </label>
        <p className="sm-field__hint">
          Used to answer <code className="mono">sudo</code> prompts automatically during tool
          installs, so they don't hang waiting for input. Leave blank if the account already has
          passwordless sudo configured.
        </p>

        {error && <p className="sm-form__error">{error}</p>}

        <div className="sm-form__actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Connect server
          </Button>
        </div>
      </form>
    </Modal>
  );
}
