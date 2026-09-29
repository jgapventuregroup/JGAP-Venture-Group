const JGAP_LEARNING_BOOK_OUTLINE=[
['Part 1 — Real Estate Foundations','Understanding How Real Estate Investing Works'],['Part 1 — Real Estate Foundations','Types of Real Estate Investments'],['Part 1 — Real Estate Foundations','Gross Rent'],['Part 1 — Real Estate Foundations','Vacancy'],['Part 1 — Real Estate Foundations','Operating Expenses'],['Part 1 — Real Estate Foundations','NOI'],['Part 1 — Real Estate Foundations','Debt Service'],['Part 1 — Real Estate Foundations','Cash Flow'],['Part 1 — Real Estate Foundations','Cap Rate'],['Part 1 — Real Estate Foundations','Cash-on-Cash Return'],['Part 1 — Real Estate Foundations','DSCR'],
['Part 2 — Finding Deals','Where to Find Properties'],['Part 2 — Finding Deals','Finding Off-Market Deals'],['Part 2 — Finding Deals','Working With Realtors'],['Part 2 — Finding Deals','Analyzing Multifamily Properties'],['Part 2 — Finding Deals','Deal Radar'],['Part 2 — Finding Deals','Evaluating Asking Prices'],['Part 2 — Finding Deals','Making an Offer'],
['Part 3 — Analyzing a Deal','Reading the Numbers'],['Part 3 — Analyzing a Deal','Building a Pro Forma'],['Part 3 — Analyzing a Deal','Understanding Financing'],['Part 3 — Analyzing a Deal','Rehab Costs'],['Part 3 — Analyzing a Deal','Holding Costs'],['Part 3 — Analyzing a Deal','Due Diligence'],['Part 3 — Analyzing a Deal','Identifying Red Flags'],['Part 3 — Analyzing a Deal','Deal Analyzer Walkthrough'],
['Part 4 — Buying & Closing','Getting Financing'],['Part 4 — Buying & Closing','Working With Lenders'],['Part 4 — Buying & Closing','Inspections'],['Part 4 — Buying & Closing','Appraisals'],['Part 4 — Buying & Closing','Closing'],['Part 4 — Buying & Closing','What Happens After Closing'],
['Part 5 — Managing the Investment','Property Management'],['Part 5 — Managing the Investment','Tenants'],['Part 5 — Managing the Investment','Leases'],['Part 5 — Managing the Investment','Rent Collection'],['Part 5 — Managing the Investment','Repairs & Maintenance'],['Part 5 — Managing the Investment','Contractors'],['Part 5 — Managing the Investment','Keeping Financial Records'],
['Part 6 — Growing the Business','Scaling From One Property to Multiple Properties'],['Part 6 — Growing the Business','Multifamily Investing'],['Part 6 — Growing the Business','Reinvesting Cash Flow'],['Part 6 — Growing the Business','Partnerships'],['Part 6 — Growing the Business','Building Business Systems'],['Part 6 — Growing the Business','Moving Into Other Investments'],
['Part 7 — Advanced Investing','Refinancing'],['Part 7 — Advanced Investing','BRRRR'],['Part 7 — Advanced Investing','House Flipping'],['Part 7 — Advanced Investing','Value-Add Investing'],['Part 7 — Advanced Investing','Commercial Real Estate'],['Part 7 — Advanced Investing','Laundromat & Other Business Investments'],
['Part 8 — JGAP Investor Playbook','Real Estate Taxes: Legal Tax Planning, Depreciation & Cost Segregation'],['Part 8 — JGAP Investor Playbook','Real Estate Abbreviations & Investor Vocabulary'],['Part 8 — JGAP Investor Playbook','JGAP Real Estate Investor Reference Guide']
];
async function ensureLearningBookOutline(){
 const {data:{user}}=await sb.auth.getUser();if(!user)return;
 const {data:existing}=await sb.from('learning_book_chapters').select('chapter_number').eq('user_id',user.id);
 const have=new Set((existing||[]).map(x=>Number(x.chapter_number)));
 const missing=JGAP_LEARNING_BOOK_OUTLINE.map((x,i)=>({user_id:user.id,chapter_number:i+1,part_title:x[0],chapter_title:x[1]})).filter(x=>!have.has(x.chapter_number));
 if(missing.length){const r=await sb.from('learning_book_chapters').insert(missing);if(r.error)console.warn('Learning book outline setup:',r.error);}
 await seedLearningBookLessons(user.id);
}

const JGAP_LEARNING_BOOK_LESSON_CONTENT={54:{source:"JGAP Investor Reference Guide — built from the Learning Book and primary-source research",title:"JGAP Real Estate Investor Reference Guide",html:`<h3>JGAP Real Estate Investor Reference Guide</h3><p>This is the quick-reference section of the JGAP Learning Book. Use it when you are analyzing a property, preparing a file for a lender, organizing records for a CPA, or reviewing a deal before making an offer.</p><h4>Core Deal Formulas</h4><ul><li><b>Effective Gross Income (EGI)</b> = Gross Potential Income − Vacancy/Credit Loss + Other Property Income.</li><li><b>NOI</b> = Effective Gross Income − Operating Expenses.</li><li><b>Cash Flow Before Taxes</b> = NOI − Debt Service.</li><li><b>Cap Rate</b> = NOI ÷ Property Price/Value.</li><li><b>DSCR</b> = NOI ÷ Annual Debt Service.</li><li><b>Cash-on-Cash Return</b> = Annual Pre-Tax Cash Flow ÷ Total Cash Invested.</li><li><b>LTV</b> = Loan Amount ÷ Property Value.</li></ul><h4>Property Purchase File Checklist</h4><ul><li>Purchase and sale agreement and amendments</li><li>Earnest money documentation</li><li>Closing Disclosure and settlement statements</li><li>Deed, title documents and title insurance</li><li>Loan application, commitment, note and mortgage/deed of trust</li><li>Inspection reports and appraisal</li><li>Survey, zoning, permits and certificates of occupancy when applicable</li><li>Insurance policies and property-tax records</li><li>Current leases, rent roll and tenant records</li><li>Contractor estimates, invoices, receipts and proof of payment</li><li>Before-and-after photographs for significant work</li></ul><h4>Underwriting Questions</h4><ol><li>What is the actual current rent by unit?</li><li>What evidence supports the market-rent assumption?</li><li>What vacancy and collection assumption is reasonable?</li><li>Which expenses are paid by the owner and which are paid by tenants?</li><li>What repairs or capital expenditures are likely in the next 12–36 months?</li><li>What is current NOI based on verified records?</li><li>What is stabilized NOI, and what assumptions are required to reach it?</li><li>What financing terms are actually available?</li><li>How does the deal perform if rent, vacancy, expenses or interest rates are worse than expected?</li><li>What is the planned exit and what could make that exit harder?</li></ol><h4>Tax Reference</h4><p>For residential rental property, the IRS says rental income generally must be reported and common rental expenses can include items such as maintenance, insurance, taxes and interest when the requirements are met. Depreciation is a capital expense used to recover the cost of income-producing property over its prescribed recovery period. Residential rental property generally uses the straight-line method with a mid-month convention, and depreciation begins when qualifying property is ready and available for rent. Repairs and improvements must be distinguished because improvements generally must be capitalized rather than immediately deducted as ordinary rental expenses.</p><p><b>Important:</b> Tax treatment depends on the facts, tax year and applicable law. Use the current IRS guidance and your CPA/tax professional for the actual return.</p><h4>Questions to Ask Your CPA</h4><ul><li>Which expenses should be currently deducted versus capitalized?</li><li>What depreciation method and placed-in-service date apply?</li><li>Would a cost-segregation study be useful for this property?</li><li>How do passive-activity and at-risk rules affect my losses?</li><li>Do I qualify for any applicable real-estate-professional or material-participation treatment?</li><li>Are there QBI considerations for my rental activities?</li><li>Should I consider a 1031 exchange before a planned sale?</li><li>What records do you need from me each month and at year-end?</li></ul><h4>Investor Rule</h4><p>If you cannot explain a number, abbreviation, document, assumption or source, stop before relying on it. Find out what it means, verify the underlying information, document the answer, and then continue the analysis.</p><h4>Primary Reference</h4><p>The IRS's current Publication 527 explains residential rental income, expenses, depreciation, repairs and improvements, and reporting considerations. Keep the current IRS publications and forms alongside this guide because tax rules can change.</p>`},53:{source:"JGAP research + HUD/Fannie Mae/industry terminology",title:"Real Estate Abbreviations & Investor Vocabulary",html:`<h3>Real Estate Abbreviations & Investor Vocabulary</h3><p>This reference chapter explains the abbreviations investors, lenders, property managers, real estate agents and contractors commonly use. Use the search tab in the app for the quick-reference version.</p><h4>Core Deal Analysis</h4><ul><li><b>NOI</b> — Net Operating Income: property income after operating expenses, before debt service.</li><li><b>DSCR</b> — Debt Service Coverage Ratio: NOI divided by annual debt service.</li><li><b>Cap Rate</b> — Capitalization Rate: NOI divided by property value or price.</li><li><b>CoC</b> — Cash-on-Cash Return: annual pre-tax cash flow divided by cash invested.</li><li><b>GRM</b> — Gross Rent Multiplier: price divided by annual gross rent.</li><li><b>ROI</b> — Return on Investment.</li><li><b>IRR</b> — Internal Rate of Return.</li><li><b>EM</b> — Equity Multiple.</li><li><b>OER</b> — Operating Expense Ratio.</li><li><b>EGI</b> — Effective Gross Income.</li><li><b>PGI</b> — Potential Gross Income.</li><li><b>GPI</b> — Gross Potential Income.</li><li><b>ARV</b> — After Repair Value.</li><li><b>PPU</b> — Price Per Unit / Price Per Door.</li><li><b>PSF</b> — Price Per Square Foot.</li></ul><h4>Financing & Lending</h4><ul><li><b>LTV</b> — Loan-to-Value.</li><li><b>LTC</b> — Loan-to-Cost.</li><li><b>LTP</b> — Loan-to-Purchase-Price.</li><li><b>P&amp;I</b> — Principal and Interest.</li><li><b>PITI</b> — Principal, Interest, Taxes and Insurance.</li><li><b>PITIA</b> — Principal, Interest, Taxes, Insurance and Association dues/fees.</li><li><b>DTI</b> — Debt-to-Income.</li><li><b>APR</b> — Annual Percentage Rate.</li><li><b>ARM</b> — Adjustable-Rate Mortgage.</li><li><b>FRM</b> — Fixed-Rate Mortgage.</li><li><b>HELOC</b> — Home Equity Line of Credit.</li><li><b>LOC</b> — Line of Credit.</li><li><b>DSCR Loan</b> — Debt-service-coverage-ratio-based investor loan.</li><li><b>PMI</b> — Private Mortgage Insurance.</li><li><b>MIP</b> — Mortgage Insurance Premium.</li><li><b>IO</b> — Interest Only.</li><li><b>AM</b> — Amortization / Amortizing, depending on context.</li><li><b>GSE</b> — Government-Sponsored Enterprise.</li><li><b>FNMA</b> — Federal National Mortgage Association (Fannie Mae).</li><li><b>FHLMC</b> — Federal Home Loan Mortgage Corporation (Freddie Mac).</li><li><b>GNMA</b> — Government National Mortgage Association (Ginnie Mae).</li></ul><h4>Property & Market Terms</h4><ul><li><b>SF</b> — Square Feet / Square Foot.</li><li><b>GLA</b> — Gross Living Area.</li><li><b>GBA</b> — Gross Building Area.</li><li><b>FMR</b> — Fair Market Rent.</li><li><b>AMI</b> — Area Median Income.</li><li><b>REO</b> — Real Estate Owned.</li><li><b>HOA</b> — Homeowners Association.</li><li><b>COA</b> — Condominium Owners Association.</li><li><b>POA</b> — Property Owners Association, depending on local usage.</li><li><b>MLS</b> — Multiple Listing Service.</li><li><b>DOM</b> — Days on Market.</li><li><b>CMA</b> — Comparative Market Analysis.</li><li><b>AVM</b> — Automated Valuation Model.</li><li><b>FMV</b> — Fair Market Value.</li><li><b>Comps</b> — Comparable properties or comparable sales/rentals.</li></ul><h4>Investment Strategies</h4><ul><li><b>BRRRR</b> — Buy, Rehab, Rent, Refinance, Repeat.</li><li><b>RE</b> — Real Estate.</li><li><b>REI</b> — Real Estate Investing.</li><li><b>CRE</b> — Commercial Real Estate.</li><li><b>SFR</b> — Single-Family Residence.</li><li><b>MF</b> — Multifamily.</li><li><b>STR</b> — Short-Term Rental.</li><li><b>MTR</b> — Mid-Term Rental.</li><li><b>LTR</b> — Long-Term Rental.</li><li><b>SFH</b> — Single-Family Home.</li><li><b>ADU</b> — Accessory Dwelling Unit.</li><li><b>MAO</b> — Maximum Allowable Offer.</li><li><b>JV</b> — Joint Venture.</li><li><b>LP</b> — Limited Partner / Limited Partnership, depending on context.</li><li><b>GP</b> — General Partner.</li></ul><h4>Purchase, Contract & Closing</h4><ul><li><b>EMD</b> — Earnest Money Deposit.</li><li><b>DD</b> — Due Diligence.</li><li><b>PSA</b> — Purchase and Sale Agreement.</li><li><b>LOI</b> — Letter of Intent.</li><li><b>CO</b> — Certificate of Occupancy.</li><li><b>CD</b> — Closing Disclosure.</li><li><b>HUD-1</b> — Historic settlement statement form; still encountered in some contexts.</li><li><b>ALTA</b> — American Land Title Association; commonly seen in ALTA settlement statements/surveys.</li><li><b>QI</b> — Qualified Intermediary, especially in a 1031 exchange.</li><li><b>1031</b> — Section 1031 like-kind exchange of qualifying business/investment real property.</li><li><b>APN</b> — Assessor's Parcel Number.</li><li><b>PIN</b> — Parcel Identification Number, terminology varies by jurisdiction.</li><li><b>POA</b> — Power of Attorney, when used in a legal/closing context.</li></ul><h4>Property Management & Operations</h4><ul><li><b>PM</b> — Property Management or Property Manager.</li><li><b>CAM</b> — Common Area Maintenance.</li><li><b>CAPEX</b> — Capital Expenditures.</li><li><b>OPEX</b> — Operating Expenses.</li><li><b>R&M</b> — Repairs & Maintenance.</li><li><b>MTM</b> — Month-to-Month.</li><li><b>YOY</b> — Year-over-Year.</li><li><b>MoM</b> — Month-over-Month.</li><li><b>RR</b> — Replacement Reserves / Reserve Requirement, depending on context.</li><li><b>RUBS</b> — Ratio Utility Billing System.</li><li><b>CAM</b> — Common Area Maintenance.</li><li><b>U&O</b> — Use and Occupancy, terminology varies by jurisdiction.</li></ul><h4>Taxes, Accounting & Legal</h4><ul><li><b>QBI</b> — Qualified Business Income.</li><li><b>CPA</b> — Certified Public Accountant.</li><li><b>GAAP</b> — Generally Accepted Accounting Principles.</li><li><b>MACRS</b> — Modified Accelerated Cost Recovery System.</li><li><b>IRC</b> — Internal Revenue Code.</li><li><b>IRS</b> — Internal Revenue Service.</li><li><b>REPS</b> — Real Estate Professional Status.</li><li><b>PAL</b> — Passive Activity Loss.</li><li><b>W-9</b> — Request for Taxpayer Identification Number and Certification.</li><li><b>1099</b> — Information-return family used for reporting certain payments, with specific forms for different payment types.</li><li><b>EIN</b> — Employer Identification Number.</li><li><b>LLC</b> — Limited Liability Company.</li><li><b>DBA</b> — Doing Business As.</li><li><b>SSN</b> — Social Security Number.</li><li><b>TIN</b> — Taxpayer Identification Number.</li></ul><h4>Government & Housing Programs</h4><ul><li><b>HUD</b> — U.S. Department of Housing and Urban Development.</li><li><b>FHA</b> — Federal Housing Administration.</li><li><b>VA</b> — U.S. Department of Veterans Affairs / VA home-loan program, depending on context.</li><li><b>USDA</b> — U.S. Department of Agriculture.</li><li><b>FEMA</b> — Federal Emergency Management Agency.</li><li><b>FDIC</b> — Federal Deposit Insurance Corporation.</li><li><b>FCRA</b> — Fair Credit Reporting Act.</li><li><b>FHLB</b> — Federal Home Loan Bank.</li><li><b>HFA</b> — Housing Finance Agency.</li><li><b>HQS</b> — Housing Quality Standards.</li><li><b>NSPIRE</b> — National Standards for the Physical Inspection of Real Estate, HUD inspection framework.</li><li><b>HAP</b> — Housing Assistance Payments.</li><li><b>PHA</b> — Public Housing Agency.</li><li><b>Section 8</b> — Common name for the Housing Choice Voucher program.</li></ul><h4>Investor Rule</h4><p>Never assume an abbreviation has only one meaning. Context matters. For example, “POA” can mean Power of Attorney or Property Owners Association, and “AM” can refer to amortization or mean something entirely different in another document. When a lender, title company, attorney, CPA or realtor uses an unfamiliar abbreviation, ask what it means before signing or underwriting anything.</p><p><b>Study goal:</b> You should be able to look at a listing, lender quote, appraisal, lease, closing statement or property-management report and understand the common abbreviations without having to stop and guess.</p>`},

3:{source:"Lesson 2 - Understanding Rental Property Numbers.docx",title:"Gross Rent",html:`<h3>Lesson: Understanding Rental Property Numbers</h3><p><b>Gross rent</b> is the total rental income a property would generate before subtracting vacancy or operating expenses.</p><h4>Example</h4><p>A four-unit property with each unit renting for $1,000 produces $4,000/month, or $48,000/year in gross scheduled rent.</p><p>The lesson emphasizes that gross rent is only the beginning. It does not account for vacancy, repairs, taxes, insurance, management, or the mortgage.</p><h4>Investor Questions</h4><ul><li>What are the current rents?</li><li>What could the units reasonably rent for?</li><li>Are rents below market?</li><li>Are there additional income opportunities?</li></ul>`},
4:{source:"Lesson 2 - Understanding Rental Property Numbers.docx",title:"Vacancy",html:`<h3>Lesson: Vacancy</h3><p>A rental property is not necessarily occupied 100% of the time. Tenants move out, units need repairs, leasing can take time, and collections can be imperfect.</p><h4>Example</h4><p>Gross rent of $48,000 with a 5% vacancy assumption produces $2,400 of vacancy and $45,600 of effective rental income.</p><p>The lesson's purpose is to avoid pretending that every scheduled dollar of rent will be collected.</p>`},
5:{source:"Lesson 2 - Understanding Rental Property Numbers.docx",title:"Operating Expenses",html:`<h3>Lesson: Operating Expenses</h3><p>Operating expenses are the costs associated with running and maintaining the property.</p><ul><li>Property taxes</li><li>Insurance</li><li>Repairs and maintenance</li><li>Property management</li><li>Owner-paid utilities</li><li>Landscaping and pest control</li><li>Accounting and legal expenses</li><li>Administrative and common-area expenses</li></ul><h4>Example</h4><p>The lesson's four-unit example uses $17,500 of annual operating expenses. Effective rental income of $45,600 less $17,500 produces $28,100 of NOI.</p>`},
6:{source:"Lesson 2 - Understanding Rental Property Numbers.docx",title:"NOI",html:`<h3>Lesson: Net Operating Income (NOI)</h3><p><b>NOI</b> tells us how much income the property produces from its operations before debt service and income taxes.</p><p><b>Formula:</b> Gross Rent − Vacancy/Credit Loss − Operating Expenses = NOI</p><h4>Example</h4><p>$48,000 Gross Rent − $2,400 Vacancy − $17,500 Operating Expenses = <b>$28,100 NOI</b>.</p><p>NOI is a property-level operating measure. It is not the same as the owner's cash flow after the mortgage.</p>`},
7:{source:"Lesson 2 - Understanding Rental Property Numbers.docx",title:"Debt Service",html:`<h3>Lesson: Debt Service</h3><p>Debt service is the required payment on the property's loan. In the lesson's simplified example, annual mortgage debt service is $18,000.</p><p>With $28,100 NOI and $18,000 of debt service, $10,100 remains as annual cash flow before taxes, or approximately $842/month.</p><p>The lesson also stresses asking how much will be borrowed, what interest rate can be obtained, what the monthly payment will be, and what annual debt service will be.</p>`},
8:{source:"Lesson 11 — Cash Flow.docx",title:"Cash Flow",html:`<h3>Lesson 11 — Cash Flow</h3><p>Cash flow is the money remaining from property operations after operating expenses and debt service have been paid.</p><p><b>Formula:</b> NOI − Debt Service = Cash Flow Before Taxes</p><h4>Important distinction</h4><p>Gross rent is not cash flow, and NOI is not cash flow. Debt service is what separates NOI from cash flow.</p><h4>Cash-Flow Waterfall</h4><ol><li>Calculate Gross Rental Income.</li><li>Subtract Vacancy.</li><li>Calculate Effective Gross Income.</li><li>Subtract Operating Expenses.</li><li>Calculate NOI.</li><li>Subtract Debt Service.</li><li>Calculate Cash Flow Before Taxes.</li></ol><p>The lesson also introduces cash-flow sensitivity and reserves as important considerations.</p>`},
9:{source:"Lesson 13 — Cap Rate(1).docx",title:"Cap Rate",html:`<h3>Lesson 13 — Cap Rate</h3><p>Cap rate measures the relationship between a property's Net Operating Income (NOI) and its price or value.</p><p><b>Formula:</b> Cap Rate = NOI ÷ Property Price × 100</p><h4>Example</h4><p>$30,000 NOI ÷ $300,000 price = 10% cap rate.</p><p>Cap rate looks at unlevered property performance. It does not ask how much cash remains after the mortgage; that is a cash-flow and cash-on-cash question.</p><h4>Cap Rate vs. Cash-on-Cash</h4><p>Cap Rate measures NOI relative to property price/value. Cash-on-Cash Return measures annual cash flow relative to investor cash invested.</p><h4>Underwriting caution</h4><p>The lesson stresses that cap rate is only as good as the NOI behind it. If NOI is overstated, the cap rate is overstated. Investors should calculate and review their own NOI rather than simply accepting a seller's NOI.</p><h4>Current vs. Pro Forma vs. Stabilized</h4><p>Current cap rate uses current operating performance. Pro forma cap rate uses projected future NOI. Stabilized cap rate uses a reasonably supportable stabilized NOI and depends on successfully achieving that projected performance.</p>`},
10:{source:"Lesson 12 — Cash-on-Cash Return(1).docx",title:"Cash-on-Cash Return",html:`<h3>Lesson 12 — Cash-on-Cash Return</h3><p>Cash-on-cash return measures annual cash flow generated by an investment compared with the amount of cash the investor has invested.</p><p><b>Formula:</b> Annual Cash Flow ÷ Total Cash Invested × 100</p><h4>Example</h4><p>$10,000 annual cash flow ÷ $100,000 total cash invested = 10% cash-on-cash return.</p><p>The lesson explains that this measurement helps investors understand the relationship between capital invested and annual cash flow, which matters because investors have limited capital.</p>`},
11:{source:"Lesson 14 — DSCR(1).docx",title:"DSCR",html:`<h3>Lesson 14 — DSCR</h3><p><b>DSCR — Debt Service Coverage Ratio</b> answers a practical question: Does the property's NOI provide enough income to cover its annual debt service?</p><p><b>Formula:</b> DSCR = NOI ÷ Annual Debt Service</p><h4>Debt Service</h4><p>For this lesson, annual debt service is treated as annual principal plus interest payments.</p><h4>Coverage Example</h4><p>If a property produces $100,000 NOI and requires $80,000 annual debt service, $100,000 ÷ $80,000 = <b>1.25x</b>. The property produces 1.25 times the amount needed to cover its annual debt service.</p>`},
15:{source:"Lesson 7 - RENT COMPS.docx",title:"Rent Comps",html:`<h3>Lesson 7 — Rent Comps</h3><p>Rent comps are comparable rental properties used as evidence about what a property can reasonably rent for.</p><h4>Three Rent Numbers</h4><ul><li><b>Current Rent:</b> what the property is actually receiving today.</li><li><b>Market Rent:</b> what comparable properties indicate the property could reasonably rent for today, assuming similar characteristics and condition.</li><li><b>Stabilized Rent:</b> a reasonably supportable rent level expected after the property reaches a sustainable operating condition.</li></ul><p><b>A comp is evidence, not an automatic answer.</b> Similar properties can differ in location, unit type, size, condition, amenities, utilities, parking, age, and tenant market.</p><h4>Why It Matters</h4><p>Rent assumptions affect gross income, NOI, cash flow, property value, financing analysis, and offer price.</p><h4>Stabilized Rent Discipline</h4><p>Stabilized rent is not whatever number produces the desired cash flow. It needs evidence. The lesson presents a rent ladder from current rent to current market/as-is, renovated rent, and stabilized rent.</p>`},
19:{source:"Lesson 6 - READING REAL ESTATE LISTINGS.docx",title:"Reading Real Estate Listings",html:`<h3>Lesson 6 — Reading Real Estate Listings</h3><p><b>A listing is the beginning of the investigation—not the conclusion.</b> Listing information may be incomplete, rounded, estimated, outdated, selectively presented, based on seller information, or based on public records. It should not automatically be treated as verified underwriting data.</p><h4>The Three-Column Method</h4><ul><li><b>Facts:</b> information directly stated in the listing.</li><li><b>Claims:</b> statements that require verification, such as “below-market rents” or “huge upside.”</li><li><b>Missing Information:</b> underwriting inputs not provided, such as actual expenses, taxes, insurance, utilities, repairs, management, rent roll, lease terms, and collections.</li></ul><h4>Investor Workflow</h4><ol><li>Extract the property facts.</li><li>Identify claims.</li><li>Identify missing information.</li><li>Request documentation.</li><li>Verify income and expenses.</li><li>Research comparable rents and sales.</li><li>Inspect the property.</li><li>Underwrite the deal.</li><li>Determine maximum price/terms based on your criteria.</li><li>Decide whether the opportunity deserves an offer or further investigation.</li></ol><h4>FACT — ASSUMPTION — VERIFY</h4><p>The lesson recommends putting these three words at the top of every underwriting file. It also warns against underwriting from a best-case scenario and recommends thinking in conservative, base, and upside cases.</p>`},
52:{source:"IRS research — Pub. 527, Pub. 925, Pub. 946, §1031 and Cost Segregation guidance",title:"Real Estate Taxes",html:`<h3>Real Estate Taxes — How Real Estate Investors Legally Reduce, Defer, and Plan for Taxes</h3>
<p><b>Purpose:</b> Learn how rental-property taxes work, what records to keep, how depreciation and cost segregation can affect taxable income, and which tax-planning questions should be taken to your CPA before a purchase, refinance, renovation, or sale.</p>
<div class="card" style="margin:12px 0"><b>Important:</b> This is an investor education lesson, not individualized tax or legal advice. Federal tax rules change. Your CPA should verify the rules, elections, limitations, and state/local treatment for each property and tax year.</div>
<h4>1. The Big Idea: Cash Flow Is Not the Same as Taxable Income</h4>
<p>A property can put cash in your bank account while showing much less taxable income because some deductions are non-cash, especially depreciation. The basic rental-property concept is to report rental income and deduct allowable rental expenses, while recovering the depreciable cost of income-producing property over its applicable recovery period.</p>
<p><b>Simple illustration:</b> Suppose a property has $48,000 of annual gross rent, $2,400 of vacancy, and $17,500 of operating expenses. NOI is $28,100. If annual debt service is $18,000, cash flow before taxes is $10,100. If $12,000 of that debt service is interest and $6,000 is principal, and the property has $10,000 of depreciation, a simplified taxable-income illustration is $28,100 NOI − $12,000 interest − $10,000 depreciation = $6,100. The $6,000 principal payment is not simply a current rental expense.</p>
<p>This is only an illustration. Actual tax treatment depends on basis, placed-in-service dates, passive-activity rules, elections, property use, and other facts.</p>
<h4>2. The Tax Code Map an Investor Should Know</h4>
<ul>
<li><b>IRC §162:</b> ordinary and necessary business expenses are the starting point for many business deductions.</li>
<li><b>IRC §168 / MACRS:</b> depreciation rules for qualifying property.</li>
<li><b>IRC §168(k):</b> special depreciation/bonus-depreciation rules for qualifying property.</li>
<li><b>IRC §179:</b> election to expense certain qualifying property subject to its rules and limitations.</li>
<li><b>IRC §469:</b> passive-activity and material-participation rules.</li>
<li><b>IRC §1031:</b> qualifying like-kind exchanges of business/investment real property can generally defer recognition of gain when the requirements are met.</li>
<li><b>IRC §199A:</b> may provide a qualified business income deduction when its requirements are satisfied; rental real estate has specific rules and a safe harbor.</li>
</ul>
<h4>3. Paperwork: What JGAP Should Keep for Every Property</h4>
<ul>
<li>Purchase contract, settlement statement/Closing Disclosure, deed and title documents.</li>
<li>Loan documents, amortization schedule, lender statements, refinance documents and points/loan-cost records.</li>
<li>Appraisal, inspection, survey and environmental reports when applicable.</li>
<li>Land/building allocation and the records supporting the depreciable basis.</li>
<li>Every repair and improvement invoice, receipt, contractor bill, permit and payment record.</li>
<li>Property-tax bills, insurance declarations and premiums, utilities, HOA/association records and management fees.</li>
<li>Rent roll, leases, deposits, rent receipts, bank statements and records of other rental income.</li>
<li>Legal, accounting, CPA, property-management and professional-fee invoices.</li>
<li>Vehicle/mileage and travel records when a deduction is otherwise allowable.</li>
<li>Contractor W-9s, payment records and information-return/1099 documentation when applicable.</li>
<li>Depreciation schedules, prior tax returns, cost-segregation studies and supporting engineering/asset schedules.</li>
<li>For a sale: original purchase records, improvement history, depreciation history, selling costs, closing statement and 1031 documentation if applicable.</li>
</ul>
<p><b>JGAP rule:</b> Never rely on a bank statement alone to explain a tax item. Keep the invoice/receipt, the business purpose, the property it belongs to, and the payment evidence together.</p>
<h4>4. Repairs vs. Improvements — One of the Most Important Distinctions</h4>
<p>Generally, a repair or maintenance cost may be deductible when it is not required to be capitalized. An improvement generally must be capitalized and recovered through depreciation. Improvements include costs that better, restore, or adapt property to a new or different use.</p>
<p><b>Example:</b> Replacing a broken faucet may be a repair. Replacing a roof is generally an improvement that is capitalized and depreciated. Do not label a capital improvement a “repair” simply to create a current deduction.</p>
<p>There are tax elections and safe harbors that can affect capitalization. Ask the CPA to classify large projects before the books are closed.</p>
<h4>5. Depreciation — The Major Non-Cash Deduction</h4>
<p>Residential rental buildings are generally depreciated using the straight-line method over a 27.5-year recovery period under GDS, with a mid-month convention. Land is not depreciated. Personal property and certain other components can have different recovery periods.</p>
<p>Depreciation generally begins when the rental property is ready and available for rent. The depreciable basis is not simply the mortgage amount; it is based on the property's tax basis, with land separated from depreciable property and adjusted for applicable rules.</p>
<h4>6. Cost Segregation — Accelerating Depreciation</h4>
<p>A cost-segregation study analyzes a property and identifies components that may qualify for shorter depreciation lives instead of treating everything as the long-life building. The IRS describes cost segregation as a fact-intensive determination involving tax law and engineering analysis.</p>
<p><b>Illustrative example:</b> Imagine a $300,000 purchase with $60,000 allocated to land and $240,000 to the depreciable building. A qualified study might identify some components that belong in shorter-life classifications. If $30,000 of qualifying property were identified, the timing of deductions could change substantially compared with depreciating the entire building as residential rental property. The exact allocation must be supported by the study and applicable tax rules.</p>
<p><b>Important:</b> Cost segregation does not make an expense disappear. It changes the timing and classification of depreciation deductions. Accelerated deductions can reduce current taxable income but can also affect basis and the tax consequences of a later sale.</p>
<h4>7. Bonus Depreciation — Current Federal Rule to Watch</h4>
<p>For certain qualified property acquired and placed in service after January 19, 2025, current IRS guidance provides for a 100% special depreciation allowance unless an election out or other applicable rule changes the result. Qualified property generally includes tangible MACRS property with a recovery period of 20 years or less, subject to the detailed rules.</p>
<p>This does <b>not</b> mean that an entire residential rental building automatically receives 100% bonus depreciation. The building itself generally remains long-life residential rental property. Cost-segregation components and other qualifying assets must be evaluated individually.</p>
<h4>8. Passive Loss Rules</h4>
<p>Rental real estate is generally treated as a passive activity unless an exception applies. An actively participating taxpayer may qualify for a special allowance of up to $25,000 of rental real-estate loss against nonpassive income, subject to the statutory phaseout and other requirements. Unused passive losses can generally carry forward under the passive-activity rules.</p>
<p>Do not assume that a tax loss on paper automatically reduces wages or other nonpassive income. Your CPA must apply the passive-activity and at-risk rules to the actual facts.</p>
<h4>9. Real Estate Professional Status</h4>
<p>For an individual to qualify as a real estate professional for federal passive-activity purposes, the IRS says both tests must be met: more than half of the individual's personal services in trades or businesses must be performed in qualifying real-property trades or businesses in which the individual materially participated, and the individual must perform more than 750 hours of services during the year in those businesses.</p>
<p>This status is not something to claim casually. Keep contemporaneous time records and discuss the material-participation requirements with the CPA before relying on the treatment.</p>
<h4>10. Section 199A / QBI</h4>
<p>Some rental real estate may qualify for the §199A qualified business income deduction when the requirements are satisfied. Revenue Procedure 2019-38 provides a safe harbor for certain rental real estate enterprises. Among other requirements, it calls for separate books and records, specified rental-service hours, contemporaneous records, and a statement attached to the tax return when the safe harbor is used.</p>
<p>Do not assume every rental automatically receives a QBI deduction. Ask the CPA whether the activity qualifies and whether the safe harbor is appropriate.</p>
<h4>11. Section 1031 — Deferring Gain on a Qualifying Exchange</h4>
<p>A qualifying §1031 like-kind exchange can generally defer recognition of gain when business or investment real property is exchanged for qualifying like-kind real property and the requirements are satisfied. Since 2018, §1031 generally applies only to real property, not personal or intangible property. Property held primarily for sale does not qualify.</p>
<p><b>Investor lesson:</b> A 1031 exchange is a tax-deferral strategy, not a magic elimination of tax. Timing, identification, qualified-intermediary procedures, replacement-property rules, boot and basis all matter. Talk to the CPA and qualified intermediary before closing the sale.</p>
<h4>12. Legal Ways to Keep More Money in the Business</h4>
<ol>
<li><b>Capture every legitimate deductible expense.</b> Do not miss ordinary and necessary property costs simply because the receipt was small.</li>
<li><b>Separate repairs from capital improvements.</b> Correct classification prevents both missed deductions and improper deductions.</li>
<li><b>Build a correct depreciation schedule.</b> Land, building, improvements and qualifying personal property should be tracked correctly.</li>
<li><b>Evaluate cost segregation before major acquisitions or renovations.</b> Compare the study cost with the expected tax and cash-flow benefit.</li>
<li><b>Plan the timing of purchases and placed-in-service dates.</b> Tax deductions depend on when property is actually placed in service and on the applicable rules.</li>
<li><b>Review passive-loss limits.</b> A loss may be deductible now, limited, or carried forward depending on the taxpayer's situation.</li>
<li><b>Ask about §199A/QBI.</b> Determine whether the rental activity qualifies and whether the safe harbor or another trade-or-business route applies.</li>
<li><b>Plan exits before selling.</b> Review depreciation recapture, gain, adjusted basis, selling costs and whether a 1031 exchange is appropriate before signing a contract.</li>
<li><b>Keep clean records.</b> Good documentation is part of the tax strategy because it supports the deductions and elections you are claiming.</li>
</ol>
<h4>13. What JGAP Should Never Do</h4>
<ul>
<li>Do not hide rental income.</li>
<li>Do not invent repairs, mileage, business trips or other expenses.</li>
<li>Do not backdate invoices or alter records to create deductions.</li>
<li>Do not call personal expenses business expenses.</li>
<li>Do not assume an LLC makes income tax disappear.</li>
<li>Do not claim a deduction just because another investor says they did it.</li>
</ul>
<h4>14. JGAP Year-End Tax Checklist</h4>
<ol>
<li>Reconcile every property bank/credit account.</li>
<li>Verify all rent and other property income.</li>
<li>Separate repairs, maintenance and capital improvements.</li>
<li>Verify property taxes and insurance.</li>
<li>Reconcile mortgage interest and principal.</li>
<li>Update depreciation and improvement schedules.</li>
<li>Collect contractor W-9/1099 information.</li>
<li>Review mileage/travel records.</li>
<li>Review passive-loss, at-risk, QBI and real-estate-professional questions with the CPA.</li>
<li>Review any planned refinance, sale or 1031 exchange before the transaction closes.</li>
<li>Give the CPA a complete property-by-property package rather than a box of mixed receipts.</li>
</ol>
<h4>15. Questions to Ask the CPA Before Buying the Next Property</h4>
<ul>
<li>What will my depreciable basis be, and how should land be allocated?</li>
<li>Should we obtain a cost-segregation study?</li>
<li>Which assets may qualify for current bonus depreciation or §179?</li>
<li>Will passive-loss rules limit the deduction?</li>
<li>Could I qualify as a real estate professional, and what records would we need?</li>
<li>Does the rental activity qualify for §199A/QBI?</li>
<li>How should major repairs and improvements be classified?</li>
<li>What should we reserve for estimated taxes?</li>
<li>If I sell, what will depreciation do to my gain and tax bill?</li>
<li>Would a 1031 exchange fit the investment plan?</li>
</ul>
<h4>JGAP Takeaway</h4>
<p><b>The goal is not to “get around” taxes illegally. The goal is to understand the tax code early enough to make legal, documented decisions before the money is spent.</b> The best tax conversation happens before buying, renovating, refinancing or selling—not after the year is over.</p>
<p><b>Core references:</b> IRS Publication 527 (Residential Rental Property), Publication 925 (Passive Activity and At-Risk Rules), Publication 946 (How To Depreciate Property), Revenue Procedure 2019-38, IRS §1031 guidance, and the IRS Cost Segregation Audit Techniques Guide.</p>`},};
async function seedLearningBookLessons(userId){
 const rows=Object.entries(JGAP_LEARNING_BOOK_LESSON_CONTENT).map(([chapter_number,v])=>({user_id:userId,chapter_number:Number(chapter_number),content_html:v.html,source_file_name:v.source}));
 const {data:existing}=await sb.from('learning_book_chapters').select('id,chapter_number,content_html').eq('user_id',userId);
 const have=new Map((existing||[]).map(x=>[Number(x.chapter_number),x]));
 for(const r of rows){
   const current=have.get(r.chapter_number);
   if(current){
     if(!current.content_html || !current.content_html.trim()){
       const u=await sb.from('learning_book_chapters').update({content_html:r.content_html,source_file_name:r.source_file_name,updated_at:new Date().toISOString()}).eq('id',current.id);
       if(u.error) console.warn('Learning book lesson update:',u.error);
     }
   }else{
     const outline=JGAP_LEARNING_BOOK_OUTLINE[r.chapter_number-1];
     const i=await sb.from('learning_book_chapters').insert({
       user_id:userId,
       chapter_number:r.chapter_number,
       part_title:outline?outline[0]:'',
       chapter_title:outline?outline[1]:r.title,
       content_html:r.content_html,
       source_file_name:r.source
     });
     if(i.error) console.warn('Learning book lesson insert:',i.error);
   }
 }
}

function learningBookActionSheet(chapter,lesson){
  const title=lesson?.lesson_title||chapter?.chapter_title||'This lesson';
  const safe=escapeHtml(title);
  return '<div class="lbActionSheet" style="margin-top:18px;padding:18px;border:1px solid #d8e3ef;border-radius:12px;background:#f8fbff">'+
    '<div style="font-weight:800;font-size:18px">JGAP Action Sheet</div>'+ 
    '<p class="muted" style="margin:6px 0 14px">Turn <b>'+safe+'</b> into an investor action.</p>'+
    '<div class="detailGrid" style="grid-template-columns:1fr 1fr;gap:12px">'+
      '<div><b>What I learned</b><div contenteditable="true" style="min-height:78px;margin-top:6px;border:1px solid #ccd5e2;border-radius:9px;padding:10px;background:#fff">Write the 1–3 most important things you learned.</div></div>'+
      '<div><b>What I need to verify</b><div contenteditable="true" style="min-height:78px;margin-top:6px;border:1px solid #ccd5e2;border-radius:9px;padding:10px;background:#fff">List numbers, documents, assumptions or facts you cannot verify yet.</div></div>'+
    '</div>'+ 
    '<div style="margin-top:14px"><b>Action checklist</b><label style="display:block;margin-top:8px"><input type="checkbox"> I can explain this concept without guessing.</label><label style="display:block;margin-top:6px"><input type="checkbox"> I identified the numbers or documents that matter.</label><label style="display:block;margin-top:6px"><input type="checkbox"> I recorded questions that need an answer.</label><label style="display:block;margin-top:6px"><input type="checkbox"> I completed one real-world action related to this lesson.</label></div>'+ 
    '<div style="margin-top:14px"><b>JGAP Decision Checkpoint</b><p style="margin:6px 0">What would make me continue, investigate further, negotiate, or walk away?</p><div contenteditable="true" style="min-height:70px;border:1px solid #ccd5e2;border-radius:9px;padding:10px;background:#fff">Write your answer here.</div></div>'+ 
    '</div>';
}

async function renderLearningBookPage(){
 const {data:{user}}=await sb.auth.getUser();if(!user){authView();return;}
 shell();const main=document.querySelector('.layout>main');if(!main)return;
 main.innerHTML='<div class="pageHead"><div><h1>📚 JGAP Real Estate Investor\'s Learning Book</h1><div class="muted">Build your real estate education book one chapter at a time.</div></div><div class="toolbar"><button class="secondary" onclick="printLearningBook()">🖨️ Print</button><button class="secondary" onclick="downloadLearningBook()">⬇️ Download</button><button class="primary" onclick="emailLearningBook()">✉️ Email</button></div></div><div class="panel" style="margin-bottom:16px;background:#f8fbff"><b>How we will build it</b><span class="muted"> Your uploaded files can be added to the appropriate chapters without changing the original files. We can expand and polish the book as you upload more material.</span></div><div class="detailGrid" style="grid-template-columns:310px minmax(0,1fr)"><div class="panel" style="padding:14px"><div class="sectionTitle">Book Outline</div><input id="learningBookSearch" placeholder="Search chapters..." oninput="filterLearningBookChapters()"><div id="learningBookList"><div class="muted">Loading book...</div></div></div><div class="panel"><div id="learningBookEditor"><div class="muted">Select a chapter.</div></div></div></div>';
 window.__learningBookChapters=[];await ensureLearningBookOutline();
 const {data,error}=await sb.from('learning_book_chapters').select('id,chapter_number,part_title,chapter_title,content_html,source_file_name,updated_at').eq('user_id',user.id).order('chapter_number');
 if(error){document.getElementById('learningBookList').innerHTML='<div class="error">Unable to load the learning book: '+escapeHtml(error.message)+'</div>';return;}
 window.__learningBookChapters=data||[];filterLearningBookChapters();const firstPopulated=window.__learningBookChapters.find(c=>c.content_html&&c.content_html.trim());const firstChapter=firstPopulated||window.__learningBookChapters[0];if(firstChapter)selectLearningBookChapter(firstChapter.id);
}
function filterLearningBookChapters(){
 const q=(document.getElementById('learningBookSearch')?.value||'').toLowerCase().trim(),host=document.getElementById('learningBookList');if(!host)return;
 const rows=(window.__learningBookChapters||[]).filter(c=>(c.part_title+' '+c.chapter_title).toLowerCase().includes(q));let lastPart='';
 host.innerHTML=rows.map(c=>{const part=c.part_title!==lastPart?'<div class="muted" style="font-size:11px;font-weight:800;text-transform:uppercase;margin:12px 4px 5px">'+escapeHtml(c.part_title)+'</div>':'';lastPart=c.part_title;return part+'<button type="button" class="secondary" data-book-chapter="'+c.id+'" style="display:block;width:100%;text-align:left;margin:4px 0;white-space:normal"><b>Chapter '+c.chapter_number+'</b><div>'+escapeHtml(c.chapter_title)+'</div></button>';}).join('')||'<div class="muted">No chapters found.</div>';
 host.querySelectorAll('[data-book-chapter]').forEach(b=>b.addEventListener('click',()=>selectLearningBookChapter(b.dataset.bookChapter)));
}
function selectLearningBookChapter(id){
 const c=(window.__learningBookChapters||[]).find(x=>x.id===id);if(!c)return;window.__learningBookCurrentId=id;const e=document.getElementById('learningBookEditor');if(!e)return;
 e.innerHTML='<div class="pageHead" style="margin-bottom:12px"><div><div class="muted">Chapter '+c.chapter_number+' • '+escapeHtml(c.part_title)+'</div><h2 style="margin:4px 0">'+escapeHtml(c.chapter_title)+'</h2></div><span class="muted" style="font-size:12px">Last saved '+new Date(c.updated_at).toLocaleString()+'</span></div><label style="font-weight:700;font-size:13px">Chapter content</label><div id="learningBookContent" contenteditable="true" spellcheck="true" style="min-height:560px;border:1px solid #ccd5e2;border-radius:9px;padding:20px;background:#fff;outline:none;line-height:1.7;font-size:16px">'+(c.content_html||'')+'</div><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap"><span id="learningBookSaveStatus" class="muted" style="font-size:12px">Edit this chapter and save when ready.</span><button class="primary" onclick="saveLearningBookChapter()">Save Chapter</button></div>';
}
async function saveLearningBookChapter(){
 const id=window.__learningBookCurrentId,content=document.getElementById('learningBookContent')?.innerHTML||'';if(!id)return;
 const {error}=await sb.from('learning_book_chapters').update({content_html:content,updated_at:new Date().toISOString()}).eq('id',id);if(error){alert('Could not save chapter: '+error.message);return;}
 const c=(window.__learningBookChapters||[]).find(x=>x.id===id);if(c){c.content_html=content;c.updated_at=new Date().toISOString();}const s=document.getElementById('learningBookSaveStatus');if(s)s.textContent='Saved '+new Date().toLocaleTimeString();
}
function learningBookPrintHtml(){
 const rows=(window.__learningBookChapters||[]).slice().sort((a,b)=>a.chapter_number-b.chapter_number);
 return '<!doctype html><html><head><meta charset="utf-8"><title>JGAP Real Estate Investor\'s Learning Book</title><style>.lbActionSheet{break-inside:avoid;margin-top:22px;padding:16px;border:1px solid #ccd5e2;background:#f8fbff}body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;line-height:1.65;color:#172033}h1{text-align:center;margin-top:80px}h2{margin-top:55px;border-bottom:1px solid #ddd;padding-bottom:8px}.chapter{page-break-before:always}@media print{body{margin:0 30px}}</style></head><body><h1>JGAP Real Estate Investor\'s Learning Book</h1><p style="text-align:center">JGAP Venture Group LLC</p>'+rows.map(c=>'<section class="chapter"><div class="muted">Chapter '+c.chapter_number+' • '+escapeHtml(c.part_title)+'</div><h2>'+escapeHtml(c.chapter_title)+'</h2>'+(c.content_html||'<p><em>This chapter has not been developed yet.</em></p>')+'</section>').join('')+'</body></html>';
}
function printLearningBook(){const w=window.open('','_blank');if(!w){alert('Please allow pop-ups for JGAP to print the book.');return;}w.document.write(learningBookPrintHtml());w.document.close();w.focus();setTimeout(()=>w.print(),300);}
function downloadLearningBook(){const blob=new Blob([learningBookPrintHtml()],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='JGAP-Real-Estate-Investors-Learning-Book.html';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
function emailLearningBook(){const subject=encodeURIComponent("JGAP Real Estate Investor's Learning Book"),body=encodeURIComponent("I am sharing the JGAP Real Estate Investor's Learning Book.\\n\\nUse the JGAP app to download or print the current book.");window.location.href='mailto:?subject='+subject+'&body='+body;}


/* === JGAP LEARNING BOOK — CHAPTER → LESSON SYSTEM === */

const JGAP_ADDITIONAL_BOOK_LESSONS={
20:[
 {title:"Reading the Numbers",html:"<p>Before deciding whether a property is a deal, separate <b>facts</b> from <b>assumptions</b>. Facts include verified rents, tax bills, insurance quotes, utility bills, leases, and actual loan terms. Assumptions include future rent, vacancy, repairs, appreciation, and exit value.</p><ul><li>Build the income side from unit-by-unit evidence.</li><li>Normalize recurring operating expenses.</li><li>Keep one-time repairs and capital expenditures separate.</li><li>Calculate NOI before debt service.</li><li>Then test the proposed financing and cash flow.</li></ul><p><b>JGAP rule:</b> never let a seller's pro forma become your underwriting without verification.</p>"} ,
 {title:"From Listing to Underwriting",html:"<p>Start with the listing, but finish with primary documents. Compare asking price with current income, realistic market rents, physical condition, and comparable sales. Record every assumption in the Deal Analyzer so another person could reproduce the conclusion.</p><p>Run at least three views: <b>as-is</b>, <b>stabilized</b>, and <b>stress case</b>. A property that only works under optimistic assumptions should not be treated as though those assumptions are facts.</p>"}
],
21:[
 {title:"Building a Pro Forma",html:"<p>A pro forma is a forward-looking operating model. Start with current verified income, then make each adjustment explicit rather than hiding it inside a single projected number.</p><ol><li>Gross potential rent.</li><li>Vacancy and credit loss.</li><li>Other income.</li><li>Operating expenses.</li><li>NOI.</li><li>Debt service.</li><li>Cash flow before taxes.</li></ol><p>Document the source for every major assumption and keep historical and projected numbers visibly separate.</p>"} ,
 {title:"Stress-Testing the Pro Forma",html:"<p>Change one assumption at a time: lower rents, higher vacancy, higher insurance, higher repairs, or a higher interest rate. Then run a combined downside case. The goal is not to predict the future; it is to learn how much room the deal has before the economics break.</p>"}
],
22:[
 {title:"Understanding Financing",html:"<p>Financing changes both the return and the risk of an investment. Compare loan amount, interest rate, amortization, term, fees, reserves, prepayment provisions, and required equity—not just the advertised rate.</p><p>Calculate annual debt service and compare it with NOI. Then determine how much cash must actually be invested at closing, including closing costs and required reserves.</p>"} ,
 {title:"Match the Loan to the Deal",html:"<p>A short-term loan can create refinance risk; a high-leverage loan can increase cash-on-cash return while reducing monthly cushion; an adjustable rate can introduce payment uncertainty. Choose financing based on the property's business plan and risk capacity, not one isolated metric.</p>"}
],
23:[
 {title:"Estimating Rehab Costs",html:"<p>Rehab estimates should be built from a written scope of work. Break the project into trades and line items: roofing, HVAC, plumbing, electrical, kitchens, baths, flooring, paint, exterior, site work, permits, cleanup, and contingency.</p><p>Use contractor bids when possible and keep a separate contingency for unknown conditions. Never confuse your own unpaid labor with cash that must be available to complete the project.</p>"} ,
 {title:"Value Creation vs. Spending",html:"<p>Every rehab dollar should have a reason. Some work protects the asset, some improves rentability, and some may increase value. Compare the expected benefit with the cost and schedule. Cosmetic work that does not improve rent, occupancy, durability, or resale should be questioned.</p>"}
],
24:[
 {title:"Holding Costs",html:"<p>Holding costs are the costs that continue while a property is being renovated, marketed, leased, or stabilized. Include interest, taxes, insurance, utilities, lawn care, security, permits, and other recurring costs.</p><p>Build a month-by-month timeline. A project that takes six months instead of three can materially change the required cash and return.</p>"} ,
 {title:"Protect the Cash Budget",html:"<p>Set aside funds for overruns and delays before starting work. Track budgeted, committed, paid, and remaining amounts. A rehab budget is not complete until it also explains how long the money must remain tied up.</p>"}
],
25:[
 {title:"Due Diligence",html:"<p>Due diligence is the process of proving that the deal you think you are buying is actually the deal you are buying. Review leases, rent roll, income, expenses, title, taxes, insurance, physical condition, zoning, permits, utilities, environmental concerns, and financing.</p><p>Create a written checklist with a responsible person and deadline for each item.</p>"} ,
 {title:"Verify Before You Waive",html:"<p>Do not rely on verbal answers when a document can verify the issue. If a material fact cannot be verified, record the uncertainty and model the downside. Your due-diligence file should show what was requested, what was received, what was inspected, and what remains unresolved.</p>"}
],
26:[
 {title:"Identifying Red Flags",html:"<p>Common red flags include unsupported rents, unexplained expense gaps, deferred maintenance, insurance problems, unpaid taxes, title issues, unauthorized units, code concerns, tenant disputes, unusual concessions, and financial records that do not reconcile.</p><p>A red flag is not automatically a deal killer. It is a signal that requires investigation and a quantified response.</p>"} ,
 {title:"Red Flags in the Numbers",html:"<p>Look for unusually low expenses, sudden rent jumps, occupancy that does not match the rent roll, missing utility costs, inconsistent tax records, or projected income that is far above current collections. Ask what evidence supports each unusual number.</p>"}
],
27:[
 {title:"Using the Deal Analyzer",html:"<p>Enter the asking price separately from the JGAP offer price. Then enter verified rents, vacancy, expenses, financing, rehab, and closing costs. The analyzer should answer a specific question: <b>what happens if we buy this property on these terms?</b></p><p>Save the assumptions and notes so the analysis can be revisited after new information arrives.</p>"} ,
 {title:"Walk Away When the Numbers Say Walk Away",html:"<p>Set a maximum price or required terms before negotiations. If the seller will not meet the economics, record the reason and move on. A disciplined investor protects capital by rejecting deals that do not meet the underwriting standard.</p>"}
],
28:[
 {title:"Getting Financing",html:"<p>Prepare a lender package before making an offer whenever possible. Include personal financial information requested by the lender, property details, purchase price, requested loan amount, operating information, rehab budget, and a clear explanation of the business plan.</p>"} ,
 {title:"Compare Financing Offers",html:"<p>Compare total cost and structure: rate, points, fees, amortization, maturity, reserves, guarantees, prepayment penalties, closing timeline, and underwriting conditions. A lower rate is not automatically a lower total cost.</p>"}
],
29:[
 {title:"Working With Lenders",html:"<p>Give lenders complete and consistent information. If a number changes, update the lender promptly. Ask what conditions must be satisfied before closing and what could delay funding.</p>"} ,
 {title:"Build a Lender Network",html:"<p>Maintain a record of lender type, loan size, geography, property type, leverage, rates, fees, required reserves, and contact history. Over time, this becomes a financing database that helps JGAP move faster without relying on one lender.</p>"}
],
30:[
 {title:"Property Inspections",html:"<p>An inspection is an information-gathering process, not a substitute for your own underwriting. Review structure, roof, HVAC, electrical, plumbing, moisture, drainage, safety systems, appliances, and visible defects.</p>"} ,
 {title:"Turn Inspection Findings Into Dollars",html:"<p>Convert material findings into repair estimates, reserves, or negotiation items. Separate immediate safety issues from deferred maintenance and optional improvements. Then rerun the deal analysis using realistic costs.</p>"}
],
31:[
 {title:"Understanding Appraisals",html:"<p>An appraisal is an independent valuation report prepared for a stated purpose and scope. Review the comparable sales, adjustments, property description, condition, and assumptions rather than treating the final value as unquestionable.</p>"} ,
 {title:"When Value and Price Differ",html:"<p>If the appraisal differs from your purchase price or underwriting value, identify why. A difference can reflect condition, comparable selection, income assumptions, market changes, or property-specific issues. Reconcile the difference before committing additional capital.</p>"}
],
32:[
 {title:"Closing the Purchase",html:"<p>Closing is where the contract, financing, title work, insurance, funds, and transfer documents come together. Review the final settlement figures against your approved budget and loan terms before signing.</p>"} ,
 {title:"The Closing File",html:"<p>Keep the signed purchase agreement, amendments, closing disclosure or settlement statement, deed, title documents, loan documents, insurance, inspection reports, appraisal, and receipts together. A complete closing file makes future accounting, refinancing, tax work, and resale easier.</p>"}
],
33:[
 {title:"After Closing",html:"<p>The first weeks after closing should establish control. Confirm insurance, utilities, locks, leases, rent instructions, vendor contacts, emergency procedures, accounting categories, and property records.</p>"} ,
 {title:"Stabilize the Property",html:"<p>Identify the first 30-day priorities: safety, habitability, rent collection, urgent repairs, tenant communication, and documentation. Do not immediately spend money on cosmetic improvements while basic operations are unresolved.</p>"}
],
34:[
 {title:"Property Management",html:"<p>Property management is a system, not a single person. Define leasing, screening, rent collection, maintenance, inspections, accounting, communication, and emergency responsibilities. Decide which tasks JGAP performs and which are delegated.</p>"} ,
 {title:"Management Economics",html:"<p>Compare management fees with the value of time, expertise, response speed, and reduced owner workload. The objective is reliable operations that allow the owner to focus on acquisitions and higher-value decisions.</p>"}
],
35:[
 {title:"Tenant Operations",html:"<p>Good tenant management starts with consistent screening, clear expectations, lawful lease terms, prompt communication, and documented maintenance procedures. Apply the same written standards to comparable applicants and situations.</p>"} ,
 {title:"Tenant Retention",html:"<p>Retention can reduce turnover costs and vacancy. Respond to legitimate maintenance issues, communicate clearly about renewals, and keep the property safe and functional. Measure turnover cost rather than assuming retention is always cheaper.</p>"}
],
36:[
 {title:"Leases",html:"<p>A lease defines the rights and obligations of the landlord and tenant. Track rent, deposit, term, renewal, utilities, maintenance responsibilities, late fees, notices, and other material provisions.</p>"} ,
 {title:"Lease Administration",html:"<p>Keep a lease summary for every unit and calendar important dates. Never rely on memory for expirations, renewal notices, inspections, or rent changes. Use the actual lease and applicable law when making decisions.</p>"}
],
37:[
 {title:"Rent Collection",html:"<p>Rent collection should be predictable, documented, and easy to reconcile. Establish a standard due date, payment method, receipt process, delinquency workflow, and reporting routine consistent with the lease and applicable law.</p>"} ,
 {title:"Managing Delinquency",html:"<p>Act early when rent becomes delinquent. Document communications, follow the lease and applicable legal notice requirements, and avoid informal side agreements that create inconsistent records or unequal treatment.</p>"}
],
38:[
 {title:"Repairs and Maintenance",html:"<p>Maintenance protects the asset and the tenant experience. Separate emergency, urgent, routine, and capital work. Track work orders from request through completion, cost, vendor, and payment.</p>"} ,
 {title:"Preventive Maintenance",html:"<p>Use recurring inspections and service schedules for roofs, HVAC, plumbing, electrical systems, smoke and carbon-monoxide devices, exterior drainage, and other property-specific systems. Preventive work can reduce surprises, although it does not eliminate them.</p>"}
],
39:[
 {title:"Contractors",html:"<p>Use written scopes, clear prices, payment milestones, insurance and licensing checks where applicable, and documented change orders. Avoid paying the entire contract before work is complete unless the arrangement has a specific, justified reason.</p>"} ,
 {title:"Controlling Rehab Projects",html:"<p>Track original budget, approved changes, amount paid, remaining balance, completion percentage, and inspection notes. Require photos and receipts where useful. A contractor relationship should be professional, documented, and based on the agreed scope.</p>"}
],
40:[
 {title:"Keeping Financial Records",html:"<p>Every property should have a clean financial trail. Reconcile bank activity, record rent by unit, categorize expenses consistently, retain invoices and receipts, and separate capital improvements from ordinary operating costs.</p>"} ,
 {title:"Build the Monthly Property Report",html:"<p>A useful monthly report shows income, operating expenses, debt service, cash flow, occupancy, delinquency, major repairs, capital projects, and cash reserves. Consistent reporting turns property management data into decision-making information.</p>"}
],
41:[
 {title:"Scaling the Portfolio",html:"<p>Scaling means building repeatable systems before adding volume. Standardize underwriting, lender packages, due diligence, closing files, property management, accounting, and reporting.</p>"} ,
 {title:"Avoid Buying Yourself a Job",html:"<p>Every new property adds work unless systems and people absorb it. Track owner hours, recurring tasks, and bottlenecks. Delegate repeatable work so the owner's role increasingly becomes capital allocation, negotiation, oversight, and strategy.</p>"}
],
42:[
 {title:"Multifamily Investing",html:"<p>Multifamily properties offer multiple income streams under one roof, but they also concentrate physical and tenant-management complexity. Underwrite each unit, common areas, utilities, taxes, insurance, maintenance, and turnover.</p>"} ,
 {title:"Multifamily Value",html:"<p>For income-producing property, changes in NOI can affect value. Increasing durable NOI through better operations can therefore matter more than simply making the property look nicer. Verify that projected improvements are realistic and sustainable.</p>"}
],
43:[
 {title:"Reinvesting Cash Flow",html:"<p>Cash flow can be distributed, reserved, or reinvested. Before reinvesting, maintain appropriate property reserves and account for known repairs, taxes, insurance, debt obligations, and upcoming capital needs.</p>"} ,
 {title:"Capital Allocation",html:"<p>Compare possible uses of available cash: reserves, debt reduction, rehab, another acquisition, or a business investment. Use the JGAP plan and required liquidity—not emotion—to determine how much capital can safely be committed.</p>"}
],
44:[
 {title:"Partnerships",html:"<p>A partnership should define contributions, ownership, decision rights, distributions, guarantees, responsibilities, dispute procedures, and exit rights before money is committed. Put the agreement in writing with qualified legal advice.</p>"} ,
 {title:"Choose Roles, Not Just People",html:"<p>Successful partnerships require complementary responsibilities and clear accountability. Decide who sources deals, who manages money, who handles operations, who signs contracts, and how disagreements are resolved.</p>"}
],
45:[
 {title:"Building Business Systems",html:"<p>A system is a repeatable process with an owner, inputs, steps, outputs, and a way to measure performance. Document recurring JGAP tasks such as lead intake, underwriting, lender outreach, due diligence, property management, and bookkeeping.</p>"} ,
 {title:"Automation and Delegation",html:"<p>Automate repetitive data movement where reliable, delegate tasks that require people, and keep human review for high-consequence decisions. The goal is leverage: more assets and opportunities without proportionally more owner hours.</p>"}
],
46:[
 {title:"Moving Into Other Investments",html:"<p>Once the real-estate operating system is stable, evaluate other assets or businesses using the same discipline: understand the revenue model, expenses, capital required, financing, risks, operator requirements, and exit options.</p>"} ,
 {title:"Business Acquisition Lens",html:"<p>For an operating business, focus on normalized cash flow, owner dependence, customer concentration, equipment condition, lease terms, employee requirements, working capital, and seller financing possibilities. Do not confuse reported revenue with owner-available cash.</p>"}
],
47:[
 {title:"Refinancing",html:"<p>Refinancing replaces or restructures existing debt. Compare the new loan's rate, fees, term, amortization, cash-out amount, prepayment costs, and expected change in cash flow. Calculate the break-even period for refinance costs.</p>"} ,
 {title:"Refinance Risk",html:"<p>Do not assume a future refinance is guaranteed. Appraisal value, lender standards, rates, property performance, borrower finances, and market conditions can change. Underwrite the current deal so it remains survivable if the refinance takes longer or provides less proceeds than expected.</p>"}
],
48:[
 {title:"BRRRR",html:"<p>BRRRR means Buy, Rehab, Rent, Refinance, Repeat. The strategy depends on buying at a basis that leaves room for renovation and refinance, completing durable improvements, stabilizing the rental, and obtaining financing based on the resulting property and borrower.</p>"} ,
 {title:"BRRRR Failure Points",html:"<p>Common failure points include paying too much, underestimating rehab, overestimating ARV, missing holding costs, assuming rents without evidence, and assuming refinance proceeds before lender terms are known. Model the entire cycle before buying.</p>"}
],
49:[
 {title:"House Flipping",html:"<p>Flipping is a project business. Profit depends on acquisition basis, rehab cost, financing, holding time, selling costs, and actual resale price. Include transaction costs on both sides and a realistic contingency.</p>"} ,
 {title:"Flip Timeline",html:"<p>Build a schedule from contract to closing: acquisition, permits, demolition, rough work, finishes, punch list, marketing, buyer due diligence, and resale closing. Delays consume cash through interest, taxes, insurance, utilities, and opportunity cost.</p>"}
],
50:[
 {title:"Value-Add Investing",html:"<p>Value-add investing seeks to improve a property's income, operating efficiency, condition, or usefulness. Start by identifying the specific problem and the measurable economic result before spending money.</p>"} ,
 {title:"Underwrite the Value Creation",html:"<p>For each project, record cost, expected rent or expense change, stabilization time, added risk, and exit implications. After completion, compare actual results with the original thesis so future decisions improve.</p>"}
],
51:[
 {title:"Commercial Real Estate",html:"<p>Commercial real estate can involve different leases, financing, valuation, due diligence, and tenant risks than residential property. Learn the property's lease structure, income sources, expenses, rollover schedule, zoning, environmental issues, and capital requirements.</p>"} ,
 {title:"Commercial Underwriting",html:"<p>Review tenant-by-tenant income, lease expirations, reimbursements, operating expenses, capital needs, debt terms, and exit assumptions. Commercial deals can be highly sensitive to a small number of tenants, so concentration and rollover risk deserve explicit attention.</p>"}
],
52:[
 {title:"Laundromat and Other Business Investments",html:"<p>A laundromat or other small business should be underwritten as an operating company, not like a rental property. Examine revenue by machine or service, utility costs, payroll, repairs, lease terms, equipment age, maintenance history, cash controls, competition, and normalized owner benefit.</p>"} ,
 {title:"Seller Financing and Operator Leverage",html:"<p>Seller financing can reduce the amount of cash required at closing, but the terms still matter: price, down payment, rate, amortization, maturity, security, default provisions, and whether a balloon payment is required. For any business acquisition, also determine who will operate the business and how much owner time it really requires.</p>"}
]
};


// Foundational and deal-finding chapters that were previously only outlined.
Object.assign(JGAP_ADDITIONAL_BOOK_LESSONS,{
1:[{title:"What Real Estate Investing Is",html:"<p>Real estate investing is the process of acquiring, financing, operating, improving, and eventually refinancing or selling property for financial benefit. JGAP focuses on buying assets based on verified numbers rather than emotion.</p><p>The investor's job is to understand the property, the financing, the risks, and the plan before committing capital.</p>"},{title:"The JGAP Investor Mindset",html:"<p>Think in terms of assets, cash flow, equity, risk, and time. The goal is not to own property simply because it is property; the goal is to build durable assets and systems that can reduce dependence on trading every hour for income.</p>"}],
2:[{title:"Types of Real Estate Investments",html:"<p>Common categories include single-family rentals, small multifamily, larger multifamily, commercial property, mixed-use property, development, and short- or mid-term rentals. Each has different operating, financing, management, and regulatory considerations.</p>"},{title:"Match the Strategy to the Goal",html:"<p>Before choosing a property, define the goal: current cash flow, long-term appreciation, value creation, business income, or a combination. The property and financing should support the goal rather than the other way around.</p>"}],
12:[{title:"Where to Find Properties",html:"<p>Deal sources include listed properties, off-market owners, wholesalers, brokers, public records, direct outreach, referrals, auctions, and relationships with local professionals. JGAP should track the source and contact history so good channels can be measured over time.</p>"},{title:"Build a Repeatable Lead Pipeline",html:"<p>Set criteria first, collect leads consistently, screen quickly, and move promising opportunities into the Deal Pipeline. The system should make it easy to reject poor fits without spending hours on them.</p>"}],
13:[{title:"Finding Off-Market Deals",html:"<p>Off-market sourcing means finding owners who are not currently marketing the property through a traditional listing. Possible approaches include direct mail, calls, referrals, networking, public-record research, and relationships with local professionals.</p>"},{title:"The Owner Conversation",html:"<p>Start by understanding the owner's situation and property before discussing price. Ask about condition, rents, expenses, timeline, motivation, financing, and what a successful transaction would look like. Document the facts and verify them later.</p>"}],
14:[{title:"Working With Realtors",html:"<p>A good agent can provide market knowledge, access to listings, transaction guidance, and local relationships. Tell the agent exactly what JGAP buys, how it evaluates deals, and what information is needed for underwriting.</p>"},{title:"Make the Criteria Easy to Understand",html:"<p>Give brokers a concise buy box: property types, locations, price range, unit count, condition, required returns, financing preferences, and deal structures of interest. Update the criteria as the investment plan changes.</p>"}],
15:[{title:"Analyzing Multifamily Properties",html:"<p>Analyze multifamily property unit by unit. Verify current rent, market rent, occupancy, concessions, utilities, taxes, insurance, maintenance, management, and capital needs. Then roll the verified information into a property-level model.</p>"},{title:"Price Per Unit Is Not Enough",html:"<p>Price per unit is a useful comparison but not a complete valuation method. Compare the price with income, NOI, condition, location, rents, expenses, financing, and comparable sales.</p>"}],
16:[{title:"Deal Radar",html:"<p>Deal Radar is the intake layer for opportunities that may deserve review. It should capture the source, address, asking price, units, basic income information, status, and source link when available.</p>"},{title:"From Radar to Pipeline",html:"<p>Use quick screening to decide whether an opportunity moves into analysis. Record why a lead was advanced, rejected, or left for later so the pipeline remains understandable.</p>"}],
17:[{title:"Evaluating Asking Prices",html:"<p>An asking price is the seller's starting point, not proof of value. Compare it with verified NOI, realistic rents, comparable sales, replacement or rehab needs, financing, and the return required by the investment plan.</p>"},{title:"Set the JGAP Offer",html:"<p>Use the Deal Analyzer to separate asking price, JGAP offer price, and maximum walk-away price. The offer should come from the economics and negotiation strategy rather than from a desire to win the property.</p>"}],
18:[{title:"Making an Offer",html:"<p>An offer should clearly communicate price, financing, contingencies, closing timing, earnest money, due-diligence rights, and other material terms. Use qualified legal and transaction professionals for the actual documents.</p>"},{title:"Negotiate the Whole Deal",html:"<p>Price is only one term. Financing structure, seller concessions, repairs, closing costs, timing, contingencies, and seller financing can materially change the economics. Compare the entire package.</p>"}],
19:[{title:"Reading the Numbers",html:"<p>Start with verified historical information and distinguish it from projections. Reconcile rent rolls, leases, bank statements or other records where available, operating expenses, taxes, insurance, and physical condition.</p>"},{title:"Build a Defensible Deal Thesis",html:"<p>Write down why the property should be bought, what must be true for the plan to work, what evidence supports each assumption, and what would cause JGAP to walk away. Then stress-test the thesis.</p>"}]
});

async function seedLearningBookLessonRows(userId){
  const {data:chapters,error}=await sb.from('learning_book_chapters').select('id,chapter_number,chapter_title,content_html,source_file_name').eq('user_id',userId).order('chapter_number');
  if(error||!chapters)return;
  const {data:existing}=await sb.from('learning_book_lessons').select('id,chapter_id,lesson_number').eq('user_id',userId);
  const have=new Set((existing||[]).map(x=>x.chapter_id+'|'+x.lesson_number));
  for(const c of chapters){
    if((existing||[]).some(x=>x.chapter_id===c.id))continue;
    let blocks=[];
    const html=c.content_html||'';
    const re=/<h4[^>]*>([\s\S]*?)<\/h4>/gi;
    let m,starts=[];
    while((m=re.exec(html)))starts.push({index:m.index,end:re.lastIndex,title:m[1].replace(/<[^>]+>/g,'').trim()});
    if(starts.length){
      const intro=html.slice(0,starts[0].index);
      if(intro.replace(/<[^>]+>/g,'').trim())blocks.push({title:'Chapter Introduction',html:intro});
      starts.forEach((s,i)=>{const end=i+1<starts.length?starts[i+1].index:html.length;blocks.push({title:s.title.replace(/^\d+\.\s*/,''),html:html.slice(s.end,end)});});
    }else if(html.replace(/<[^>]+>/g,'').trim()){
      blocks=[{title:c.chapter_title,html:html}];
    }else if(JGAP_ADDITIONAL_BOOK_LESSONS[c.chapter_number]){
      blocks=JGAP_ADDITIONAL_BOOK_LESSONS[c.chapter_number];
    }else{
      blocks=[{title:'Chapter Overview',html:'<p>This chapter is ready to be developed. JGAP will build this lesson from investor education material, applicable primary sources, practical examples, and the material already supplied for the Learning Book.</p><p><b>Study focus:</b> '+escapeHtml(c.chapter_title)+'.</p>'}];
    }
    for(let i=0;i<blocks.length;i++){
      const key=c.id+'|'+(i+1);if(have.has(key))continue;
      await sb.from('learning_book_lessons').insert({user_id:userId,chapter_id:c.id,lesson_number:i+1,lesson_title:blocks[i].title,content_html:blocks[i].html,source_file_name:c.source_file_name||null});
    }
  }
}

async function renderLearningBookPage(){
  const {data:{user}}=await sb.auth.getUser();if(!user){authView();return;}
  shell();const main=document.querySelector('.layout>main');if(!main)return;
  main.innerHTML='<div class="pageHead"><div><h1>📚 JGAP Real Estate Investor\'s Learning Book</h1><div class="muted">Your complete investor education book — chapters, lessons, examples, checklists and research.</div></div><div class="toolbar"><button class="secondary" onclick="printLearningBook()">🖨️ Print</button><button class="secondary" onclick="downloadLearningBook()">⬇️ Download</button><button class="primary" onclick="emailLearningBook()">✉️ Email</button></div></div><div class="panel" style="margin-bottom:16px;background:#f8fbff"><b>How this book is built:</b> your uploaded lessons are preserved, then expanded with researched investor education and primary-source material. You do not have to wait to upload the next lesson.</div><div class="detailGrid" style="grid-template-columns:310px minmax(0,1fr)"><div class="panel" style="padding:14px"><div class="sectionTitle">Book Outline</div><input id="learningBookSearch" placeholder="Search chapters..." oninput="filterLearningBookChapters()"><div id="learningBookList"><div class="muted">Loading book...</div></div></div><div class="panel"><div id="learningBookEditor"><div class="muted">Select a chapter.</div></div></div></div>';
  window.__learningBookChapters=[];await ensureLearningBookOutline();await seedLearningBookLessonRows(user.id);
  const {data,error}=await sb.from('learning_book_chapters').select('id,chapter_number,part_title,chapter_title,content_html,source_file_name,updated_at').eq('user_id',user.id).order('chapter_number');
  if(error){document.getElementById('learningBookList').innerHTML='<div class="error">Unable to load the learning book: '+escapeHtml(error.message)+'</div>';return;}
  window.__learningBookChapters=data||[];filterLearningBookChapters();
  const first=window.__learningBookChapters.find(c=>c.content_html&&c.content_html.trim())||window.__learningBookChapters[0];if(first)selectLearningBookChapter(first.id);
}

function filterLearningBookChapters(){
  const q=(document.getElementById('learningBookSearch')?.value||'').toLowerCase().trim(),host=document.getElementById('learningBookList');if(!host)return;
  const rows=(window.__learningBookChapters||[]).filter(c=>(c.part_title+' '+c.chapter_title).toLowerCase().includes(q));let lastPart='';
  host.innerHTML=rows.map(c=>{const part=c.part_title!==lastPart?'<div class="muted" style="font-size:11px;font-weight:800;text-transform:uppercase;margin:12px 4px 5px">'+escapeHtml(c.part_title)+'</div>':'';lastPart=c.part_title;return part+'<button type="button" class="secondary" data-book-chapter="'+c.id+'" style="display:block;width:100%;text-align:left;margin:4px 0;white-space:normal"><b>Chapter '+c.chapter_number+'</b><div>'+escapeHtml(c.chapter_title)+'</div></button>';}).join('')||'<div class="muted">No chapters found.</div>';
  host.querySelectorAll('[data-book-chapter]').forEach(b=>b.addEventListener('click',()=>selectLearningBookChapter(b.dataset.bookChapter)));
}

async function selectLearningBookChapter(id){
  const c=(window.__learningBookChapters||[]).find(x=>x.id===id);if(!c)return;window.__learningBookCurrentId=id;
  const e=document.getElementById('learningBookEditor');if(!e)return;
  const {data:lessons,error}=await sb.from('learning_book_lessons').select('id,lesson_number,lesson_title,content_html,completed,updated_at').eq('chapter_id',id).order('lesson_number');
  if(error){e.innerHTML='<div class="error">'+escapeHtml(error.message)+'</div>';return;}
  window.__learningBookLessons=lessons||[];
  e.innerHTML='<div class="pageHead" style="margin-bottom:12px"><div><div class="muted">Chapter '+c.chapter_number+' • '+escapeHtml(c.part_title)+'</div><h2 style="margin:4px 0">'+escapeHtml(c.chapter_title)+'</h2></div><span class="muted" style="font-size:12px">'+window.__learningBookLessons.length+' lesson'+(window.__learningBookLessons.length===1?'':'s')+'</span></div><div class="panel" style="background:#f8fbff;margin-bottom:14px"><b>Chapter overview</b><div style="margin-top:6px">'+(c.content_html||'<span class="muted">No chapter overview yet.</span>')+'</div></div><div class="sectionTitle">Lessons in this chapter</div><div id="learningBookLessonList" style="display:grid;gap:8px">'+window.__learningBookLessons.map(l=>'<button type="button" class="secondary" data-book-lesson="'+l.id+'" style="display:flex;justify-content:space-between;gap:12px;text-align:left;align-items:center;white-space:normal"><span><b>Lesson '+l.lesson_number+'</b> — '+escapeHtml(l.lesson_title)+'</span><span>'+ (l.completed?'✅':'○') +'</span></button>').join('')+'</div><div id="learningBookLessonEditor" style="margin-top:18px"><div class="muted">Choose a lesson above.</div></div>';
  e.querySelectorAll('[data-book-lesson]').forEach(b=>b.addEventListener('click',()=>openLearningBookLesson(b.dataset.bookLesson)));
  if(window.__learningBookLessons[0])openLearningBookLesson(window.__learningBookLessons[0].id);
}

function openLearningBookLesson(id){
  const l=(window.__learningBookLessons||[]).find(x=>x.id===id);if(!l)return;
  const host=document.getElementById('learningBookLessonEditor');if(!host)return;window.__learningBookCurrentLessonId=id;
  host.innerHTML='<div class="panel" style="border:2px solid #d9e3ef"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="muted">Lesson '+l.lesson_number+'</div><h3 style="margin:3px 0">'+escapeHtml(l.lesson_title)+'</h3></div><label style="font-size:13px"><input id="learningBookLessonDone" type="checkbox" '+(l.completed?'checked':'')+'> Mark lesson complete</label></div><div id="learningBookLessonContent" contenteditable="true" spellcheck="true" style="min-height:320px;border:1px solid #ccd5e2;border-radius:9px;padding:18px;background:#fff;outline:none;line-height:1.7;font-size:16px;margin-top:12px">'+(l.content_html||'')+learningBookActionSheet((window.__learningBookChapters||[]).find(c=>c.id===window.__learningBookCurrentId),l)+'</div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap"><span id="learningBookLessonStatus" class="muted">Edit and save this lesson.</span><button class="primary" onclick="saveLearningBookLesson()">Save Lesson</button></div></div>';
}

async function saveLearningBookLesson(){
  const id=window.__learningBookCurrentLessonId;if(!id)return;const content=document.getElementById('learningBookLessonContent')?.innerHTML||'',completed=!!document.getElementById('learningBookLessonDone')?.checked;
  const {error}=await sb.from('learning_book_lessons').update({content_html:content,completed,updated_at:new Date().toISOString()}).eq('id',id);
  if(error){alert('Could not save lesson: '+error.message);return;}
  const l=(window.__learningBookLessons||[]).find(x=>x.id===id);if(l){l.content_html=content;l.completed=completed;l.updated_at=new Date().toISOString();}
  const s=document.getElementById('learningBookLessonStatus');if(s)s.textContent='Saved '+new Date().toLocaleTimeString();
}

function learningBookPrintHtml(){
  const chapters=(window.__learningBookChapters||[]).slice().sort((a,b)=>a.chapter_number-b.chapter_number);
  const lessonMap=window.__learningBookLessonsByChapter||{};
  return '<!doctype html><html><head><meta charset="utf-8"><title>JGAP Real Estate Investor\'s Learning Book</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;line-height:1.65;color:#172033}h1{text-align:center;margin-top:80px}h2{margin-top:55px;border-bottom:1px solid #ddd;padding-bottom:8px}.chapter{page-break-before:always}.lesson{margin:28px 0}@media print{body{margin:0 30px}}</style></head><body><h1>JGAP Real Estate Investor\'s Learning Book</h1><p style="text-align:center">JGAP Venture Group LLC</p>'+chapters.map(c=>'<section class="chapter"><div class="muted">Chapter '+c.chapter_number+' • '+escapeHtml(c.part_title)+'</div><h2>'+escapeHtml(c.chapter_title)+'</h2>'+(c.content_html||'')+'</section>').join('')+'</body></html>';
}

async function prepareLearningBookExport(){
  const {data:{user}}=await sb.auth.getUser();if(!user)return;await seedLearningBookLessonRows(user.id);
  const {data}=await sb.from('learning_book_lessons').select('chapter_id,lesson_number,lesson_title,content_html,completed').eq('user_id',user.id).order('lesson_number');
  const map={};(data||[]).forEach(l=>(map[l.chapter_id]||(map[l.chapter_id]=[])).push(l));window.__learningBookLessonsByChapter=map;
}
async function printLearningBook(){await prepareLearningBookExport();const w=window.open('','_blank');if(!w){alert('Please allow pop-ups for JGAP to print the book.');return;}w.document.write(learningBookPrintHtmlWithLessons());w.document.close();w.focus();setTimeout(()=>w.print(),300);}
function learningBookPrintHtmlWithLessons(){
  const chapters=(window.__learningBookChapters||[]).slice().sort((a,b)=>a.chapter_number-b.chapter_number);
  const toc=chapters.map(c=>'<li>Chapter '+c.chapter_number+' — '+escapeHtml(c.chapter_title)+'</li>').join('');
  const body=chapters.map(c=>{const ls=(window.__learningBookLessonsByChapter||{})[c.id]||[];return '<section class="chapter"><div class="part">'+escapeHtml(c.part_title)+'</div><h2>Chapter '+c.chapter_number+' — '+escapeHtml(c.chapter_title)+'</h2>'+(c.content_html||'')+ls.map(l=>'<div class="lesson"><h3>Lesson '+l.lesson_number+' — '+escapeHtml(l.lesson_title)+'</h3>'+l.content_html+learningBookActionSheet(c,l)+'</div>').join('')+'</section>';}).join('');
  return '<!doctype html><html><head><meta charset="utf-8"><title>JGAP Real Estate Investor\'s Learning Book</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;line-height:1.65;color:#172033}h1{text-align:center;font-size:36px;margin-top:120px}h2{margin-top:55px;border-bottom:1px solid #ddd;padding-bottom:8px}.cover{height:850px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;page-break-after:always}.toc{page-break-after:always}.toc h2{text-align:left}.chapter{page-break-before:always}.lesson{margin:28px 0;padding-left:12px;border-left:3px solid #e2e8f0}.part{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#5b6678}@media print{body{margin:0 30px}.cover{height:95vh}}</style></head><body><section class="cover"><div style="font-size:18px;letter-spacing:.12em;text-transform:uppercase">JGAP Venture Group LLC</div><h1>JGAP Real Estate Investor\'s Learning Book</h1><p style="font-size:20px">A practical guide to analyzing, buying, managing and growing real estate investments</p><p style="margin-top:80px">Investor Education • Deal Analysis • Operations • Tax Reference</p></section><section class="toc"><h2>Table of Contents</h2><ol>'+toc+'</ol></section>'+body+'</body></html>';
}
async function downloadLearningBook(){await prepareLearningBookExport();const blob=new Blob([learningBookPrintHtmlWithLessons()],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='JGAP-Real-Estate-Investors-Learning-Book.html';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
