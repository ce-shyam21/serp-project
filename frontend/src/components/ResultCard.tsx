// src/components/ResultCard.tsx
import type { PriceItem } from '../types';
import './ResultCard.css';

interface Props {
    item: PriceItem;
}

export function ResultCard({ item }: Props) {
    return (
        <div className="result-card">
            {item.thumbnail && (
                <img
                    className="result-card__thumb"
                    src={item.thumbnail}
                    alt={item.title}
                />
            )}
            <div className="result-card__body">
                <p className="result-card__title">{item.title}</p>
                <p className="result-card__source">{item.source}</p>
            </div>
            <div className="result-card__right">
                <span className="result-card__price">{item.price}</span>
                {item.link && (
                    <a
                        className="result-card__link"
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                    >
                        View →
                    </a>
                )}
            </div>
        </div>
    );
}