from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict, Union
from datetime import datetime

class SchemaBase(BaseModel):
    model_config = ConfigDict(alias_generator=None, populate_by_name=True, from_attributes=True)

class CreateBookingRequest(BaseModel):
    customerName: str
    mobileNumber: str
    emailId: Optional[str] = "-"
    statueNumber: str
    statueImageBase64: Optional[str] = ""
    bookingDate: Optional[str] = ""
    totalAmount: float
    advanceAmount: float
    paymentMode: Optional[str] = "कॅश"
    bookedByOwner: Optional[str] = "शिव"

class MarkPaidRequest(BaseModel):
    finalPaymentMode: Optional[str] = "कॅश"
    finalPaymentOwner: Optional[str] = "शिव"
    paidAmount: Optional[float] = None
    final_payment_mode: Optional[str] = None
    final_payment_owner: Optional[str] = None
    paid_amount: Optional[float] = None

    @property
    def mode(self) -> str:
        return self.final_payment_mode or self.finalPaymentMode or "कॅश"

    @property
    def owner(self) -> str:
        return self.final_payment_owner or self.finalPaymentOwner or "शिव"

    @property
    def amount(self) -> Optional[float]:
        if self.paid_amount is not None:
            return self.paid_amount
        return self.paidAmount

class CancelRequest(BaseModel):
    cancellationReason: Optional[str] = ""
    cancellationOwner: Optional[str] = "शिव"
    cancellation_reason: Optional[str] = None
    cancellation_owner: Optional[str] = None

    @property
    def reason(self) -> str:
        if self.cancellation_reason is not None:
            return self.cancellation_reason
        return self.cancellationReason or ""

    @property
    def owner(self) -> str:
        return self.cancellation_owner or self.cancellationOwner or "शिव"

class BookingOut(BaseModel):
    id: Optional[int] = None
    rowIndex: Optional[int] = None
    bookingId: str
    bookingDate: Optional[str] = ""
    customerName: Optional[str] = ""
    mobileNumber: Optional[str] = ""
    emailId: Optional[str] = "-"
    statueNumber: Optional[str] = ""
    statueImageUrl: Optional[str] = ""
    totalAmount: Optional[float] = 0.0
    advanceAmount: Optional[float] = 0.0
    balanceAmount: Optional[float] = 0.0
    paymentMode: Optional[str] = ""
    bookedByOwner: Optional[str] = ""
    bookingStatus: Optional[str] = "BOOKED"
    pdfBillUrl: Optional[str] = ""
    finalPaymentDate: Optional[str] = ""
    finalPaymentMode: Optional[str] = ""
    cancellationReason: Optional[str] = ""
    createdTimestamp: Optional[Union[str, datetime]] = ""
    finalPaymentOwner: Optional[str] = ""
    cancellationOwner: Optional[str] = ""
    cancellationTimestamp: Optional[Union[str, datetime]] = ""

class BookingListResponse(BaseModel):
    success: bool
    bookings: List[BookingOut]

class BookingSearchResponse(BaseModel):
    success: bool
    booking: Optional[BookingOut] = None
    message: Optional[str] = ""

class BookingCreateResponse(BaseModel):
    success: bool
    bookingId: Optional[str] = ""
    pdfUrl: Optional[str] = ""
    pdfBase64: Optional[str] = ""
    balanceAmount: Optional[float] = 0.0
    message: str

class StandardResponse(BaseModel):
    success: bool
    message: str
