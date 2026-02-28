-- Migration 006: accuracy testing infrastructure
-- Tables: reference_circuits, reference_bom_items, supplier_links,
--         accuracy_test_runs, accuracy_discrepancies

-- ─────────────────────────────────────────────
-- reference_circuits
-- One row per known-good circuit with a published BOM.
-- ─────────────────────────────────────────────
CREATE TABLE public.reference_circuits (
    id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
    name         TEXT        NOT NULL,
    source_file  TEXT        NOT NULL,
    circuit_type TEXT,       -- fuzz | boost | distortion | eq | overdrive | delay | reverb | other
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (name)
);

ALTER TABLE public.reference_circuits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reference_circuits"
    ON public.reference_circuits FOR SELECT TO public USING (true);
CREATE POLICY "service_role can write reference_circuits"
    ON public.reference_circuits FOR ALL TO service_role USING (true);

-- ─────────────────────────────────────────────
-- reference_bom_items
-- Ground truth components per circuit.
-- ─────────────────────────────────────────────
CREATE TABLE public.reference_bom_items (
    id                    UUID    NOT NULL DEFAULT uuid_generate_v4(),
    circuit_id            UUID    NOT NULL REFERENCES public.reference_circuits(id) ON DELETE CASCADE,
    component_type        TEXT    NOT NULL,
    value                 TEXT    NOT NULL,
    quantity              INTEGER NOT NULL DEFAULT 1,
    reference_designators TEXT[]  NOT NULL DEFAULT '{}',
    notes                 TEXT,
    PRIMARY KEY (id)
);

CREATE INDEX idx_ref_bom_circuit ON public.reference_bom_items (circuit_id);

ALTER TABLE public.reference_bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reference_bom_items"
    ON public.reference_bom_items FOR SELECT TO public USING (true);
CREATE POLICY "service_role can write reference_bom_items"
    ON public.reference_bom_items FOR ALL TO service_role USING (true);

-- ─────────────────────────────────────────────
-- supplier_links
-- Tayda + Mouser URLs per component value.
-- ─────────────────────────────────────────────
CREATE TABLE public.supplier_links (
    id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
    component_type TEXT          NOT NULL,
    value          TEXT          NOT NULL,
    supplier       TEXT          NOT NULL CHECK (supplier IN ('tayda', 'mouser')),
    url            TEXT          NOT NULL,
    price_usd      NUMERIC(6,2),
    in_stock       BOOLEAN       NOT NULL DEFAULT true,
    verified_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (component_type, value, supplier)
);

CREATE INDEX idx_supplier_links_lookup ON public.supplier_links (component_type, value);

ALTER TABLE public.supplier_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read supplier_links"
    ON public.supplier_links FOR SELECT TO public USING (true);
CREATE POLICY "service_role can write supplier_links"
    ON public.supplier_links FOR ALL TO service_role USING (true);

-- ─────────────────────────────────────────────
-- accuracy_test_runs
-- One row per test execution (one circuit, one run).
-- ─────────────────────────────────────────────
CREATE TABLE public.accuracy_test_runs (
    id                       UUID          NOT NULL DEFAULT uuid_generate_v4(),
    circuit_id               UUID          REFERENCES public.reference_circuits(id),
    model_used               TEXT,
    overall_score            NUMERIC(5,2),
    component_count_expected INTEGER,
    component_count_found    INTEGER,
    run_at                   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE INDEX idx_accuracy_runs_circuit ON public.accuracy_test_runs (circuit_id);

ALTER TABLE public.accuracy_test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read accuracy_test_runs"
    ON public.accuracy_test_runs FOR SELECT TO public USING (true);
CREATE POLICY "service_role can write accuracy_test_runs"
    ON public.accuracy_test_runs FOR ALL TO service_role USING (true);

-- ─────────────────────────────────────────────
-- accuracy_discrepancies
-- One row per component mismatch in a test run.
-- ─────────────────────────────────────────────
CREATE TABLE public.accuracy_discrepancies (
    id                   UUID         NOT NULL DEFAULT uuid_generate_v4(),
    run_id               UUID         NOT NULL REFERENCES public.accuracy_test_runs(id) ON DELETE CASCADE,
    discrepancy_type     TEXT         NOT NULL CHECK (discrepancy_type IN ('wrong_value', 'missing', 'extra', 'wrong_type')),
    expected_value       TEXT,
    found_value          TEXT,
    component_type       TEXT,
    reference_designator TEXT,
    score_impact         NUMERIC(4,2),
    PRIMARY KEY (id)
);

CREATE INDEX idx_discrepancies_run ON public.accuracy_discrepancies (run_id);

ALTER TABLE public.accuracy_discrepancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read accuracy_discrepancies"
    ON public.accuracy_discrepancies FOR SELECT TO public USING (true);
CREATE POLICY "service_role can write accuracy_discrepancies"
    ON public.accuracy_discrepancies FOR ALL TO service_role USING (true);
