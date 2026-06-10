<?php
/**
 * Template: Post Individual
 * Post completo optimizado para lectura, conversión y SEO.
 *
 * @package GeneratePress Child
 */

get_header(); ?>

<div class="blog-layout-full">

<?php while (have_posts()) : the_post(); ?>

    <!-- BREADCRUMBS -->
    <?php pyablog_breadcrumbs(); ?>

    <div class="single-post-wrap">

        <!-- POST HEADER -->
        <header class="post-header">
            <?php pyablog_category_badge(); ?>
            <h1><?php the_title(); ?></h1>
            <?php if (has_excerpt()) : ?>
                <p class="excerpt"><?php echo esc_html(get_the_excerpt()); ?></p>
            <?php endif; ?>
            <div class="post-meta-line">
                <time datetime="<?php echo get_the_date('c'); ?>">📅 <?php echo get_the_date('j F Y'); ?></time>
                <?php pyablog_reading_time_html(); ?>
                <span>✍️ Por <a href="<?php echo esc_url(get_author_posts_url(get_the_author_meta('ID'))); ?>"><?php the_author(); ?></a></span>
                <?php
                $updated = get_the_modified_time('U');
                $published = get_the_time('U');
                if ($updated > $published + 86400) :
                ?>
                    <span class="updated">📌 Actualizado: <?php echo get_the_modified_date('j F Y'); ?></span>
                <?php endif; ?>
            </div>
        </header>

        <!-- COVER IMAGE -->
        <?php if (has_post_thumbnail()) : ?>
            <div class="post-cover">
                <?php the_post_thumbnail('full', ['class' => 'post-cover', 'alt' => esc_attr(get_the_title())]); ?>
            </div>
        <?php endif; ?>

        <!-- TABLE OF CONTENTS (generado por JS) -->
        <nav class="toc" id="toc-container" style="display:none;">
            <h3>📑 Tabla de contenidos</h3>
            <ul id="toc-list"></ul>
        </nav>

        <!-- ARTICLE BODY + injected blocks (author, CTA, share via the_content filter) -->
        <article class="entry-content">
            <?php the_content(); ?>
        </article>

        <!-- TAGS -->
        <?php
        $tags = get_the_tags();
        if ($tags) :
        ?>
            <div class="post-tags">
                <?php foreach ($tags as $tag) : ?>
                    <a href="<?php echo esc_url(get_tag_link($tag->term_id)); ?>"><?php echo esc_html($tag->name); ?></a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- PREV / NEXT -->
        <nav class="prev-next" aria-label="Navegación entre artículos">
            <div class="prev-link">
                <?php
                $prev = get_previous_post();
                if ($prev) :
                ?>
                    <a href="<?php echo esc_url(get_permalink($prev->ID)); ?>">
                        <span class="label">← Anterior</span>
                        <span class="title"><?php echo esc_html(get_the_title($prev->ID)); ?></span>
                    </a>
                <?php endif; ?>
            </div>
            <div class="next-link">
                <?php
                $next = get_next_post();
                if ($next) :
                ?>
                    <a href="<?php echo esc_url(get_permalink($next->ID)); ?>">
                        <span class="label">Siguiente →</span>
                        <span class="title"><?php echo esc_html(get_the_title($next->ID)); ?></span>
                    </a>
                <?php endif; ?>
            </div>
        </nav>

        <!-- RELATED POSTS -->
        <?php
        $related = pyablog_get_related_posts(get_the_ID(), 3);
        if ($related) :
        ?>
            <section class="related-posts-wrap">
                <h3>También puede interesarle</h3>
                <div class="related-grid">
                    <?php foreach ($related as $rpost) : setup_postdata($rpost); ?>
                        <article class="grid-item">
                            <?php if (has_post_thumbnail($rpost->ID)) : ?>
                            <div class="grid-item-image">
                                <?php echo get_the_post_thumbnail($rpost->ID, 'medium'); ?>
                            </div>
                            <?php endif; ?>
                            <div class="grid-item-body">
                                <?php pyablog_category_badge($rpost->ID); ?>
                                <h3><a href="<?php echo esc_url(get_permalink($rpost->ID)); ?>"><?php echo esc_html(get_the_title($rpost->ID)); ?></a></h3>
                                <p><?php echo esc_html(wp_trim_words(get_the_excerpt($rpost->ID), 15)); ?></p>
                                <div class="post-meta">
                                    <time datetime="<?php echo get_the_date('c', $rpost->ID); ?>"><?php echo get_the_date('j M Y', $rpost->ID); ?></time>
                                </div>
                            </div>
                        </article>
                    <?php endforeach; wp_reset_postdata(); ?>
                </div>
            </section>
        <?php endif; ?>

    </div>

<?php endwhile; ?>

</div>

<?php get_footer(); ?>
