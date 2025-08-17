import './InvestmentIllustration.css'

function InvestmentIllustration() {
  return (
    <div className="investment-illustration">
      <img 
        src="/investment-illustration.svg" 
        alt="Investment Illustration" 
        className="investment-svg"
      />
      <div className="ellipse"></div>
      <div className="attribution">
        <a 
          href="https://storyset.com/business" 
          target="_blank" 
          rel="noopener noreferrer"
          className="attribution-link"
        >
          Business illustrations by Storyset
        </a>
      </div>
    </div>
  )
}

export default InvestmentIllustration 