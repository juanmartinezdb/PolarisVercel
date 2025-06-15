from app import db
from app.models.user import User

class EnergyService:
    @staticmethod
    def update_user_energy(user_id, energy_change, operation='add'):
        """Actualiza la energía del usuario
        
        Args:
            user_id: ID del usuario
            energy_change: Cantidad de energía a cambiar (siempre positiva)
            operation: 'add' para sumar XP, 'subtract' para restar XP
        """
        user = User.query.get(user_id)
        if not user:
            return False
            
        if operation == 'add':
            user.add_xp(energy_change)
        elif operation == 'subtract':
            new_xp = max(0, user.total_xp - energy_change)
            user.total_xp = new_xp
            db.session.commit()
            
        return True
    
    @staticmethod
    def handle_status_change(user_id, energy_value, old_status, new_status):
        """Maneja cambios de estado y actualiza energía accordingly"""
        energy_amount = abs(energy_value)
        
        if old_status == 'completed' and new_status in ['pending', 'skipped']:
            EnergyService.update_user_energy(user_id, energy_amount, 'subtract')
        
        elif old_status in ['pending', 'skipped'] and new_status == 'completed':
            EnergyService.update_user_energy(user_id, energy_amount, 'add')