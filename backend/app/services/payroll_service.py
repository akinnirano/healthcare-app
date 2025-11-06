"""
Payroll Processing Service with Canada and US Tax Calculations
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from ..db import models
from decimal import Decimal, ROUND_HALF_UP

class PayrollProcessor:
    """Process payroll with tax calculations for Canada and US"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_us_federal_tax(self, gross_pay: float, year: int = 2025) -> float:
        """
        Calculate US Federal Income Tax (2025 rates - approximate)
        Single filer, standard deduction
        """
        # Simplified brackets (biweekly pay period)
        if gross_pay <= 300:
            return 0.10 * gross_pay
        elif gross_pay <= 1000:
            return 30 + 0.12 * (gross_pay - 300)
        elif gross_pay <= 2000:
            return 114 + 0.22 * (gross_pay - 1000)
        elif gross_pay <= 4000:
            return 334 + 0.24 * (gross_pay - 2000)
        else:
            return 814 + 0.32 * (gross_pay - 4000)
    
    def calculate_canada_federal_tax(self, gross_pay: float, year: int = 2025) -> float:
        """
        Calculate Canadian Federal Income Tax (2025 rates - approximate)
        """
        # Simplified brackets (biweekly pay period)
        if gross_pay <= 400:
            return 0.15 * gross_pay
        elif gross_pay <= 800:
            return 60 + 0.205 * (gross_pay - 400)
        elif gross_pay <= 1600:
            return 142 + 0.26 * (gross_pay - 800)
        elif gross_pay <= 3200:
            return 350 + 0.29 * (gross_pay - 1600)
        else:
            return 814 + 0.33 * (gross_pay - 3200)
    
    def calculate_social_security(self, gross_pay: float, country_code: str, ytd_gross: float = 0) -> float:
        """
        Calculate Social Security (US) or CPP (Canada)
        """
        if country_code == "US":
            # US Social Security: 6.2% up to $160,200 (2025)
            max_income = 160200
            rate = 0.062
            if ytd_gross >= max_income:
                return 0
            taxable = min(gross_pay, max_income - ytd_gross)
            return taxable * rate
        elif country_code == "CA":
            # Canada CPP: 5.95% up to $68,500 (2025 estimate)
            max_income = 68500
            rate = 0.0595
            if ytd_gross >= max_income:
                return 0
            taxable = min(gross_pay, max_income - ytd_gross)
            return taxable * rate
        return 0
    
    def calculate_medicare(self, gross_pay: float, country_code: str) -> float:
        """
        Calculate Medicare (US) or EI (Canada)
        """
        if country_code == "US":
            # US Medicare: 1.45% (no cap)
            return gross_pay * 0.0145
        elif country_code == "CA":
            # Canada EI: 1.58% up to $63,200 (2025 estimate)
            max_income = 63200
            rate = 0.0158
            return min(gross_pay, max_income) * rate
        return 0
    
    def calculate_state_provincial_tax(
        self, 
        gross_pay: float, 
        country_code: str, 
        state_province: Optional[str] = None
    ) -> float:
        """
        Calculate State (US) or Provincial (Canada) tax
        """
        # Simplified rates - in production, these would come from tax_rates table
        rates = {
            "US": {
                "CA": 0.09,  # California
                "NY": 0.065,  # New York
                "TX": 0.0,  # Texas (no state income tax)
                "FL": 0.0,  # Florida (no state income tax)
                "default": 0.05
            },
            "CA": {
                "ON": 0.0505,  # Ontario
                "BC": 0.0506,  # British Columbia
                "AB": 0.10,  # Alberta
                "QC": 0.15,  # Quebec
                "default": 0.05
            }
        }
        
        if country_code in rates:
            state_rates = rates[country_code]
            rate = state_rates.get(state_province, state_rates["default"])
            return gross_pay * rate
        return 0
    
    def process_payroll(
        self,
        staff_id: int,
        pay_period_start: datetime,
        pay_period_end: datetime,
        hours_worked: Optional[float] = None,
        timesheet_id: Optional[int] = None
    ) -> models.Payroll:
        """
        Process payroll for a staff member
        
        Args:
            staff_id: Staff ID
            pay_period_start: Start date of pay period
            pay_period_end: End date of pay period
            hours_worked: Manual hours (optional, will use timesheet if provided)
            timesheet_id: Link to timesheet (optional)
        
        Returns:
            Payroll object with calculated taxes
        """
        # Get staff and related data
        staff = self.db.get(models.Staff, staff_id)
        if not staff:
            raise ValueError(f"Staff {staff_id} not found")
        
        user = staff.user
        if not user:
            raise ValueError(f"User not found for staff {staff_id}")
        
        company_id = user.company_id
        country_id = user.country_id
        
        if not company_id or not country_id:
            raise ValueError("Staff must be linked to a company and country")
        
        # Get salary configuration
        salary_config = staff.salary_config
        if not salary_config:
            raise ValueError(f"No salary configuration for staff {staff_id}")
        
        hourly_rate = salary_config.hourly_rate
        
        # Calculate hours worked
        if hours_worked is None:
            if timesheet_id:
                timesheet = self.db.get(models.Timesheet, timesheet_id)
                if timesheet:
                    hours_worked = timesheet.hours_worked
                else:
                    hours_worked = 0
            else:
                hours_worked = 0
        
        # Calculate regular and overtime hours
        overtime_threshold = salary_config.overtime_threshold_hours
        regular_hours = min(hours_worked, overtime_threshold)
        overtime_hours = max(0, hours_worked - overtime_threshold)
        
        # Calculate gross pay
        regular_pay = regular_hours * hourly_rate
        overtime_pay = overtime_hours * hourly_rate * salary_config.overtime_rate_multiplier
        gross_pay = regular_pay + overtime_pay
        
        # Get country for tax calculation
        country = self.db.get(models.Country, country_id)
        if not country:
            raise ValueError(f"Country {country_id} not found")
        
        country_code = country.code
        
        # Calculate YTD gross for Social Security cap check
        ytd_payrolls = self.db.query(models.Payroll).filter(
            models.Payroll.staff_id == staff_id,
            models.Payroll.pay_period_start >= datetime(pay_period_start.year, 1, 1),
            models.Payroll.pay_period_start < pay_period_start
        ).all()
        ytd_gross = sum(p.gross_pay for p in ytd_payrolls)
        
        # Calculate taxes based on country
        if country_code == "US":
            federal_tax = self.calculate_us_federal_tax(gross_pay)
        elif country_code == "CA":
            federal_tax = self.calculate_canada_federal_tax(gross_pay)
        else:
            federal_tax = gross_pay * 0.15  # Default 15%
        
        # Calculate state/provincial tax
        state_province = None  # TODO: Get from company or user profile
        state_provincial_tax = self.calculate_state_provincial_tax(
            gross_pay, country_code, state_province
        )
        
        # Calculate Social Security / CPP
        social_security_tax = self.calculate_social_security(
            gross_pay, country_code, ytd_gross
        )
        
        # Calculate Medicare / EI
        medicare_tax = self.calculate_medicare(gross_pay, country_code)
        
        # Other deductions
        benefits_deduction = salary_config.benefits_deduction if salary_config.has_benefits else 0
        other_deductions = benefits_deduction
        
        # Total deductions
        total_deductions = (
            federal_tax + 
            state_provincial_tax + 
            social_security_tax + 
            medicare_tax + 
            other_deductions
        )
        
        # Net pay
        net_pay = gross_pay - total_deductions
        
        # Round to 2 decimal places
        gross_pay = round(gross_pay, 2)
        federal_tax = round(federal_tax, 2)
        state_provincial_tax = round(state_provincial_tax, 2)
        social_security_tax = round(social_security_tax, 2)
        medicare_tax = round(medicare_tax, 2)
        other_deductions = round(other_deductions, 2)
        total_deductions = round(total_deductions, 2)
        net_pay = round(net_pay, 2)
        
        # Create tax calculation details
        tax_details = {
            "country_code": country_code,
            "state_province": state_province,
            "regular_hours": regular_hours,
            "overtime_hours": overtime_hours,
            "regular_pay": round(regular_pay, 2),
            "overtime_pay": round(overtime_pay, 2),
            "ytd_gross": ytd_gross,
            "tax_breakdown": {
                "federal_tax": federal_tax,
                "state_provincial_tax": state_provincial_tax,
                "social_security_tax": social_security_tax,
                "medicare_tax": medicare_tax,
                "benefits_deduction": benefits_deduction,
                "other_deductions": other_deductions
            }
        }
        
        # Create payroll record
        payroll = models.Payroll(
            staff_id=staff_id,
            timesheet_id=timesheet_id,
            company_id=company_id,
            country_id=country_id,
            hours_worked=hours_worked,
            hourly_rate=hourly_rate,
            gross_pay=gross_pay,
            federal_tax=federal_tax,
            state_provincial_tax=state_provincial_tax,
            social_security_tax=social_security_tax,
            medicare_tax=medicare_tax,
            other_deductions=other_deductions,
            total_deductions=total_deductions,
            net_pay=net_pay,
            total_pay=net_pay,  # Backward compatibility
            pay_period_start=pay_period_start,
            pay_period_end=pay_period_end,
            status=models.PayrollStatus.PENDING,
            tax_calculation_details=tax_details,
            createdby="system"
        )
        
        self.db.add(payroll)
        self.db.commit()
        self.db.refresh(payroll)
        
        return payroll
    
    def bulk_process_payroll(
        self,
        company_id: int,
        pay_period_start: datetime,
        pay_period_end: datetime
    ) -> List[models.Payroll]:
        """
        Process payroll for all staff in a company for a given pay period
        """
        # Get all active staff for company
        users = self.db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.is_active == True
        ).all()
        
        payrolls = []
        for user in users:
            if user.staff_profile:
                staff = user.staff_profile
                
                # Find timesheet for this period
                timesheet = self.db.query(models.Timesheet).filter(
                    models.Timesheet.staff_id == staff.id,
                    models.Timesheet.date >= pay_period_start,
                    models.Timesheet.date <= pay_period_end,
                    models.Timesheet.verified == True
                ).first()
                
                try:
                    payroll = self.process_payroll(
                        staff_id=staff.id,
                        pay_period_start=pay_period_start,
                        pay_period_end=pay_period_end,
                        timesheet_id=timesheet.id if timesheet else None,
                        hours_worked=timesheet.hours_worked if timesheet else 0
                    )
                    payrolls.append(payroll)
                except Exception as e:
                    print(f"Error processing payroll for staff {staff.id}: {e}")
                    continue
        
        return payrolls

