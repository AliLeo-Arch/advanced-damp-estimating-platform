from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.auth import require_permission
from app.config import settings
from app.database import get_db
from app.models import Customer, Site, Survey, User

router = APIRouter(tags=["crm"])


class CustomerCreate(BaseModel):
    customer_type: str = "homeowner"
    name: str = Field(min_length=1, max_length=200)
    company_name: str = ""
    email: str = ""
    telephone: str = ""
    notes: str = ""


class CustomerRead(BaseModel):
    id: int
    customer_type: str
    name: str
    company_name: str
    email: str
    telephone: str
    notes: str


class SiteCreate(BaseModel):
    label: str = "Main property"
    address_line1: str = Field(min_length=1, max_length=300)
    address_line2: str = ""
    town: str = ""
    postcode: str = ""
    property_type: str = "residential"
    access_notes: str = ""


class SiteRead(BaseModel):
    id: int
    customer_id: int
    label: str
    address_line1: str
    address_line2: str
    town: str
    postcode: str
    property_type: str
    access_notes: str


class SurveyCreate(BaseModel):
    survey_type: str = "damp_survey"
    survey_date: str = ""
    surveyor_name: str = ""
    diagnosis_summary: str = ""
    recommended_works: str = ""
    survey_fee: float | None = None
    fee_creditable: bool = True
    notes: str = ""


class SurveyRead(BaseModel):
    id: int
    site_id: int
    reference: str
    survey_type: str
    survey_date: str
    surveyor_name: str
    status: str
    diagnosis_summary: str
    recommended_works: str
    survey_fee: float
    fee_creditable: bool
    notes: str


class SurveyDetailRead(SurveyRead):
    customer_id: int
    customer_name: str
    company_name: str
    email: str
    telephone: str
    site_label: str
    site_address: str
    postcode: str


def _next_survey_ref(db: Session) -> str:
    count = db.query(Survey).count() + 1
    year = datetime.utcnow().year
    return f"SV-{year}-{count:04d}"


@router.get("/customers", response_model=list[CustomerRead])
def list_customers(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("manage_customers")),
) -> list[Customer]:
    return db.query(Customer).order_by(Customer.name.asc()).all()


@router.post("/customers", response_model=CustomerRead, status_code=201)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_customers")),
) -> Customer:
    customer = Customer(
        customer_type=payload.customer_type,
        name=payload.name,
        company_name=payload.company_name,
        email=payload.email,
        telephone=payload.telephone,
        notes=payload.notes,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    write_audit(
        db,
        action="customer_created",
        entity_type="customer",
        entity_id=customer.id,
        detail={"name": customer.name},
        actor=user,
    )
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerRead)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("manage_customers")),
) -> Customer:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/customers/{customer_id}/sites", response_model=list[SiteRead])
def list_sites(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("manage_customers")),
) -> list[Site]:
    return (
        db.query(Site)
        .filter(Site.customer_id == customer_id)
        .order_by(Site.id.asc())
        .all()
    )


@router.post(
    "/customers/{customer_id}/sites",
    response_model=SiteRead,
    status_code=201,
)
def create_site(
    customer_id: int,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_customers")),
) -> Site:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    site = Site(customer_id=customer_id, **payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    write_audit(
        db,
        action="site_created",
        entity_type="site",
        entity_id=site.id,
        detail={"customer_id": customer_id, "postcode": site.postcode},
        actor=user,
    )
    return site


@router.get("/surveys/{survey_id}", response_model=SurveyDetailRead)
def get_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("manage_surveys")),
) -> SurveyDetailRead:
    survey = db.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    site = db.get(Site, survey.site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    customer = db.get(Customer, site.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    address_parts = [
        part
        for part in [site.address_line1, site.address_line2, site.town]
        if part
    ]
    return SurveyDetailRead(
        id=survey.id,
        site_id=survey.site_id,
        reference=survey.reference,
        survey_type=survey.survey_type,
        survey_date=survey.survey_date,
        surveyor_name=survey.surveyor_name,
        status=survey.status,
        diagnosis_summary=survey.diagnosis_summary,
        recommended_works=survey.recommended_works,
        survey_fee=survey.survey_fee,
        fee_creditable=bool(survey.fee_creditable),
        notes=survey.notes,
        customer_id=customer.id,
        customer_name=customer.name,
        company_name=customer.company_name or "",
        email=customer.email or "",
        telephone=customer.telephone or "",
        site_label=site.label,
        site_address=", ".join(address_parts),
        postcode=site.postcode or "",
    )


@router.get("/sites/{site_id}/surveys", response_model=list[SurveyRead])
def list_surveys(
    site_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("manage_surveys")),
) -> list[SurveyRead]:
    rows = (
        db.query(Survey)
        .filter(Survey.site_id == site_id)
        .order_by(Survey.created_at.desc())
        .all()
    )
    return [
        SurveyRead(
            id=row.id,
            site_id=row.site_id,
            reference=row.reference,
            survey_type=row.survey_type,
            survey_date=row.survey_date,
            surveyor_name=row.surveyor_name,
            status=row.status,
            diagnosis_summary=row.diagnosis_summary,
            recommended_works=row.recommended_works,
            survey_fee=row.survey_fee,
            fee_creditable=bool(row.fee_creditable),
            notes=row.notes,
        )
        for row in rows
    ]


@router.post("/sites/{site_id}/surveys", response_model=SurveyRead, status_code=201)
def create_survey(
    site_id: int,
    payload: SurveyCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("manage_surveys")),
) -> SurveyRead:
    site = db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    survey = Survey(
        site_id=site_id,
        reference=_next_survey_ref(db),
        survey_type=payload.survey_type,
        survey_date=payload.survey_date,
        surveyor_user_id=user.id,
        surveyor_name=payload.surveyor_name or user.full_name,
        diagnosis_summary=payload.diagnosis_summary,
        recommended_works=payload.recommended_works,
        survey_fee=(
            payload.survey_fee
            if payload.survey_fee is not None
            else settings.assumed_survey_fee
        ),
        fee_creditable=1 if payload.fee_creditable else 0,
        notes=payload.notes,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    write_audit(
        db,
        action="survey_created",
        entity_type="survey",
        entity_id=survey.id,
        detail={"reference": survey.reference},
        actor=user,
    )
    return SurveyRead(
        id=survey.id,
        site_id=survey.site_id,
        reference=survey.reference,
        survey_type=survey.survey_type,
        survey_date=survey.survey_date,
        surveyor_name=survey.surveyor_name,
        status=survey.status,
        diagnosis_summary=survey.diagnosis_summary,
        recommended_works=survey.recommended_works,
        survey_fee=survey.survey_fee,
        fee_creditable=bool(survey.fee_creditable),
        notes=survey.notes,
    )
