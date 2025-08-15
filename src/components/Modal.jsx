import { Icon } from "@iconify/react/dist/iconify.js";

const NotificationModal = ({ type, title, message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className={`modal ${type}`}>
        <div className="modal-header">
          <Icon 
            icon={type === 'error' ? "material-symbols:error-outline" : "clarity:success-standard-line"} 
            className={`modal-icon ${type}`} 
          />
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close">
            <Icon icon="mdi:close" />
          </button>
        </div>
        <div className="modal-body">
          {message.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className={`modal-button ${type}`}>
            {type === 'error' ? 'Try Again' : 'Continue'}
          </button>
        </div>
      </div>
      
      <style jsx global>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          width: 100vw;
          height: 100vh;
          inset: 0;
          overflow: visible;
        }

        .modal {
          width: 90%;
          max-width: 400px;
          background-color: white;
          border-radius: 1rem;
          overflow: show;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 10000;
          opacity: 1 !important;
  transform: translate(0, 0) !important;
        }

        .modal.error {
          border-top: 4px solid #EF4444;
        }

        .modal.success {
          border-top: 4px solid #22C55E;
        }

        .modal-header {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          position: relative;
          border-bottom: 1px solid #E5E7EB;
        }

        .modal-icon {
          font-size: 2rem;
          margin-right: 1rem;
        }

        .modal-icon.error {
          color: #EF4444;
        }

        .modal-icon.success {
          color: #22C55E;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6B7280;
          cursor: pointer;
        }

        .modal-body {
          padding: 1.5rem;
          color: #4B5563;
        }

        .modal-body p {
          margin: 0.5rem 0;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          background-color: #F9FAFB;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid #E5E7EB;
        }

        .modal-button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .modal-button.error {
          background-color: #EF4444;
          color: white;
        }

        .modal-button.error:hover {
          background-color: #DC2626;
        }

        .modal-button.success {
          background-color: #22C55E;
          color: white;
        }

        .modal-button.success:hover {
          background-color: #16A34A;
        }
      `}</style>
    </div>
  );
};

export default NotificationModal;