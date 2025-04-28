import { SummaryCostRepository, SummaryCostRepositoryInterface } from "./SummaryCostRepository";
import { PaginatedOrderSummaryResult } from "../domain/OrderSummaryModel";

export class SummaryCostService {
    private summaryCostRepository: SummaryCostRepositoryInterface;

    constructor(summaryCostRepository?: SummaryCostRepositoryInterface) {
        this.summaryCostRepository = summaryCostRepository || new SummaryCostRepository();
    }

    async getSummaryCost(pages: number): Promise<PaginatedOrderSummaryResult> {
        return await this.summaryCostRepository.getSummaryCost(pages);
    }
}